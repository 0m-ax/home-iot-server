let {Socket} = require('./lib/socket');
let express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static('./static'))
http.listen(3000, function(){
console.log('listening on *:3000');
});
let l = new Socket();
l.on("newDeviceTrait",({device,trait})=>{
    console.log(device.name,device.id,trait.traitID)
    trait.set({
        red:0,
        green:0,
        blue:0
    })
})
l.on("deviceTraitUpdate",({device,trait})=>{
    send();
})
function send(){
    let oDevices = {};
    for(let [deviceID,device] of l.devices.entries()){
        let oDevice = {
            id:deviceID,
            name:device.name,
            traits:{}
        }
        for(let [traitID,trait] of device.traits.entries()){
            let oTrait = trait.export();
            oDevice.traits[traitID] = oTrait;
        }
        oDevices[deviceID] = oDevice;
    }
    io.emit("devices",oDevices)
}
io.on('connection',(socket)=>{
    send();
    socket.on('setTrait',(deviceID,traitID,data)=>{
        l.devices.get(parseInt(deviceID)).traits.get(traitID).set(data);
    })
})