# Protocol
The protocol is string based. Every packet must and will end with a newline (\n).  
Every argument in a packet is pipe seperated.  
E.g: pos|10|50|5
<br />
<br />
## Packet structure
The general packet structure looks like this:  
\<packetType><...arguments>  
E.g: game|5|1|2|3  
Where game is the packetType, 5 the first argument, 1 the second, 2 the third and 3 the fourth.

## Packet types
### motd
The motd packet is sent by the server when you connect to it. motd means "Message of the day".

**Name:** motd  
**Sender:** Server  
**Arguments:**  
| # | Type   | Description            |
|---|--------|------------------------|
| 1 | String | The message of the day |

**Example:** `motd|Hello how are you? :)`

### join
The join packet is the first packet the client has to send to the server when connecting. Remember the password otherwise you cant use the username again!

**Name:** join  
**Sender:** Client  
**Arguments:**  
| # | Type   | Description  |
|---|--------|--------------|
| 1 | String | The username |
| 2 | String | The password |

**Example:** `join|Cool|Guy`

### error
The error packet is sent by the server if something went wrong.

**Name:** error  
**Sender:** Server  
**Arguments:**  
| # | Type   | Description  |
|---|--------|--------------|
| 1 | String | The error    |

**Example:** `error|INVALID_USERNAME`

### goal
The goal packet is sent by the server to inform the client about the goal position.

**Name:** goal  
**Sender:** Server  
**Arguments:**  
| # | Type   | Description            |
|---|--------|------------------------|
| 1 | Number | x position of the goal |
| 2 | Number | y position of the goal |

**Example:** `goal|10|20`

### pos
The pos packet is sent by the server to inform the client about its position and walls.

**Name:** pos  
**Sender:** Server  
**Arguments:**  
| # | Type   | Description                                                        |
|---|--------|--------------------------------------------------------------------|
| 1 | Number | x position of the client                                           |
| 2 | Number | y position of the client                                           |
| 3 | Number | 0 if there is no wall at top and 1 if there IS a wall at top       |
| 4 | Number | 0 if there is no wall right and 1 if there IS a wall right         |
| 5 | Number | 0 if there is no wall at bottom and 1 if there IS a wall at bottom |
| 6 | Number | 0 if there is no wall left and 1 if there IS a wall left           |

**Example:** `pos|5|3|0|1|1|1`

### move
The move packet is sent by the client to decide where to walk.

**Name:** move  
**Sender:** Client  
**Arguments:**  
| # | Type   | Description             |
|---|--------|-------------------------|
| 1 | String | up, right, down or left |

**Example:** `move|up`

### chat
The chat packet is sent by the client to send a cool chat message :>.

**Name:** chat  
**Sender:** Client  
**Arguments:**  
| # | Type   | Description                 |
|---|--------|-----------------------------|
| 1 | String | The chat message to display |

**Example:** `chat|I am so cool`

### win
The win packet is sent by the server to inform the client he won.

**Name:** win  
**Sender:** Server  
**Arguments:**  
| # | Type   | Description     |
|---|--------|-----------------|
| 1 | Number | amount of wins  |
| 2 | Number | amount of loses |

**Example:** `win|1|20`

### lose
The lose packet is sent by the server to inform the client he lost.

**Name:** lose  
**Sender:** Server  
**Arguments:**  
| # | Type   | Description     |
|---|--------|-----------------|
| 1 | Number | amount of wins  |
| 2 | Number | amount of loses |

**Example:** `lose|1|20`
