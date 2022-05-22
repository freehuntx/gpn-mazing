
require 'socket'

$dataMutex = Mutex.new
$error = false

class MazeBot
    attr_accessor :name, :current_pos, :socket

    def initialize(maze, num, pw)
        @name = "FloofyDerg" + " " * num;
        @number = num

        @maze = maze
        @current_pos = {x: 0, y: 0}
        @queued_pos_count = 0

        @last_confirmed_pos = {x: 0, y: 0}

        @socket = TCPSocket.new("gpn-mazing.v6.rocks", 4000)

        sleep 0.2

        @socket.puts "join|#{name}|#{pw}\n"

        Thread.new do
            loop do
                line = @socket.gets
                unless line.is_a? String
                    sleep 1
                    next
                end 

                begin
                    $dataMutex.lock

                    puts "Got line: #{line}"

                    case line
                    when /^game\|(\d+)\|(\d+)\|(\d+)\|(\d+)/
                        @maze.max_x = $1.to_i-1
                        @maze.max_y = $2.to_i-1

                        @maze.current_goal_pos = {x: $3.to_i, y: $4.to_i}
                        @maze.wallmap = {}
                        @maze.pheromone_map = Hash.new(0)
                        @known_map = Hash.new(0)

                        @maze.start_time = Time.now()

                        @current_pos = nil

                    when /^pos\|(.*)/
                        puts "Got a position command!!"

                        data = $1.split("|")
                        @current_pos = {
                            x: data[0].to_i, y: data[1].to_i
                        }

                        @maze.mark_walls(data)

                        @maze.unlock(@name)
                    when /you cant walk into walls/
                        @error = true
                        @maze.mark_walls(@error_walls)
                        @maze.unlock(@name)
                    end
                ensure
                    $dataMutex.unlock
                end
            end
        end.abort_on_exception = true
    end

    def figure_next_position()        
        if @current_pos.nil? || @error
            puts "Moving randomly due to error!"

            @error = false
            @socket.puts "move|#{["up", "down", "left", "right"].sample}"
            return 
        end
        
        bscore = 1000;
        dir = "no_movement"

        cx = @current_pos[:x]
        cy = @current_pos[:y]

        if((Time.now() - @maze.start_time) < (10 * @number - 7))
            puts "Sleeping and awaiting maze start..."
            @socket.puts "sleep"
            
            return false
        end

        [0, 1, 2, 3].shuffle.each do |i|
            rand_adj = 0
            
            case i
            when 0 
                left_wall = @maze.wallmap[@maze.c_to_s(cx-1, cy, "r")]
                if(!(left_wall))
                    ts = @maze.get_score(cx-1, cy)
                    if(ts < (bscore+rand_adj))
                        bscore = ts
                        dir = "left"
                    end
                end
            
            when 1
                top_wall = @maze.wallmap[@maze.c_to_s(cx, cy-1, "d")]
                if(!(top_wall))
                    ts = @maze.get_score(cx, cy-1)
                    if(ts < (bscore+rand_adj))
                        bscore = ts
                        dir = "up"
                    end
                end
            when 2
                right_wall = @maze.wallmap[@maze.c_to_s(cx, cy, "r")]
                if(!(right_wall))
                    ts = @maze.get_score(cx+1, cy)
                    if(ts < (bscore+rand_adj))
                        bscore = ts
                        dir = "right"
                    end
                end
            when 3
                bottom_wall = @maze.wallmap[@maze.c_to_s(cx, cy, "d")]
                if(!(bottom_wall))
                    ts = @maze.get_score(cx, cy+1)
                    if(ts < (bscore+rand_adj))
                        bscore = ts
                        dir = "down"
                    end
                end
            end
        end

        puts "Moving #{dir}"
        @socket.puts("move|#{dir}\n")

        case dir
        when "up"
            @error_walls = [@current_pos[:x], @current_pos[:y], 1, 0, 0, 0]
        when "down"
            @error_walls = [@current_pos[:x], @current_pos[:y], 0, 0, 1, 0]
        when "left"
            @error_walls = [@current_pos[:x], @current_pos[:y], 0, 0, 0, 1]
        when "right"
            @error_walls = [@current_pos[:x], @current_pos[:y], 0, 1, 0, 0]
        end

        return true
    end
end

class MazeMap
    attr_accessor :scoremap, :wallmap, :current_goal_pos, :drones
    attr_accessor :waiting_on_pos, :start_time, :pheromone_map

    attr_accessor :max_x, :max_y

    def dump_tventy_data()
        out_array = {
            walls: @wallmap,
            positions: @drones.map { |drone| drone.current_pos },
            goal: @current_goal_pos 
        }

        begin
            $tventysock.write out_array.to_json
        rescue
            $tventysock = TCPSocket.new('2001:67c:20a1:232:b4a4:120a:d62b:be6b', 4123)
        end
    end

    def initialize()
        @scoremap = Hash.new(10000)
        @pheromone_map = Hash.new(0)

        @wallmap = Hash.new(false)
        @known_map = Hash.new(0)

        @max_x = 27;
        @max_y = 27;

        @current_goal_pos = {x: 0, y: 0}

        @waiting_on_pos = {}
        @drones = []

        @start_time = Time.now();

        @into_goal_time = nil;

        @drone_task = Thread.new do
            loop do
                sleep 1

                break if $error

                run_drones
            end
        end

        @ask_task = Thread.new do
            messages = [
                "Thank <3",
                "Great meeting you all!",
                "Good bye!",
                "CCC = <3"
            ]

            loop do
                @drones.each do |d|
                    s = messages.sample
                    d.socket.puts "chat|#{s}\n" unless s.nil?
                end

                sleep 10
            end
        end
    end

    def get_score(x, y) 
        key = c_to_s(x, y)

        return @scoremap[key].ceil
    end

    def mark_walls(data)
        return if data.nil?

        x = data[0].to_i
        y = data[1].to_i

        @pheromone_map[c_to_s(x, y)] = 0.5

        if((y-1).between? 0, @max_x)
            top_key = c_to_s(x, y-1, "d")
            @wallmap[top_key] = (data[2] == '1')
        end

        right = c_to_s(x, y, "r")
        @wallmap[right] = (data[3] == '1')

        bottom = c_to_s(x, y, "d")
        @wallmap[bottom] = (data[4] == '1')

        if((x-1).between? 0, @max_x)
            left_key = c_to_s(x-1, y, "r")
            @wallmap[left_key] = (data[5] == '1')
        end
    end

    def c_to_s(x, y, k = "") 
        (("%03d.%03d" % [x, y]) + k).to_sym
    end

    def expand_tile(x, y)
        tile_key = c_to_s(x, y);
        s = @scoremap[tile_key] || 0;

        knowns_bias = 1


        if((x-1).between? 0, @max_x)
            other_key = c_to_s(x-1, y);

            unless(@wallmap[c_to_s(x-1, y, "r")])
                if(@scoremap[other_key].nil? || (@scoremap[other_key] > s+1))
                    @scoremap[other_key] = s+ knowns_bias + @pheromone_map[c_to_s(x-1,y)]
                    @fields_to_expand << [x-1, y];
                end
            end
        end

        if((y-1).between? 0, @max_y)
            other_key = c_to_s(x, y-1);

            unless(@wallmap[c_to_s(x, y-1, "d")])
                if(@scoremap[other_key].nil? || (@scoremap[other_key] > s+1))
                    @scoremap[other_key] = s+ knowns_bias + @pheromone_map[c_to_s(x,y-1)]
                    @fields_to_expand << [x, y-1]
                end
            end
        end

        if((x+1).between? 0, @max_x)
            other_key = c_to_s(x+1, y);

            unless(@wallmap[c_to_s(x, y, "r")])
                if(@scoremap[other_key].nil? || (@scoremap[other_key] > s+1))
                    @scoremap[other_key] = s + knowns_bias + @pheromone_map[c_to_s(x+1,y)]
                    @fields_to_expand << [x+1, y]
                end
            end
        end

        if((y+1).between? 0, @max_y)
            other_key = c_to_s(x, y+1);

            unless(@wallmap[c_to_s(x, y, "d")])
                if(@scoremap[other_key].nil? || (@scoremap[other_key] > s+1))
                    @scoremap[other_key] = s + knowns_bias + @pheromone_map[c_to_s(x,y+1)]
                    @fields_to_expand << [x, y+1]
                end
            end
        end
    end

    def recalculate_scores() 
        @fields_to_expand = []
        @expanded = {}
        @scoremap = Hash.new(10000)

        @scoremap[c_to_s(@current_goal_pos[:x], @current_goal_pos[:y])] = 0;
        expand_tile(@current_goal_pos[:x], @current_goal_pos[:y])

        until(@fields_to_expand.empty?)
            expand_tile(*@fields_to_expand.shift)
        end

        puts "Tada!!"
    end

    def run_drones()
        begin
            $dataMutex.lock
            recalculate_scores

            #@pheromone_map.transform_values! { |val| val *= 0.9; }

            @waiting_on_pos = {}

            @drones.each do |d|
                @waiting_on_pos[d.name] = true if d.figure_next_position()
            end
        ensure
            $dataMutex.unlock
        end
    end

    def unlock(name)
        @waiting_on_pos.delete name

        if(@waiting_on_pos.empty?)
            @drone_task.run
        end
    end
end

$map = MazeMap.new();

3.times do |i|
    bot = MazeBot.new($map, i, "GlowIsCool!!");
    $map.drones << bot
end

Thread.stop