const dgram = require('dgram');
const EventEmitter = require('events');
class Socket  extends EventEmitter{
    constructor(){
        super();
        this.devices = new Map();
        this.server = dgram.createSocket('udp4');
        this.server.on('message',this.onMessage.bind(this))
        this.server.bind(6969,()=>{
            this.server.setBroadcast(true);
        });
    }
    onMessage(msg){
        let {id,name,traits} = JSON.parse(msg.toString('ascii').trim().replace(/[^0-9a-z\"\:\}\{\,}]/gi, ''));
        let device;
        if(this.devices.has(id)){
            device = this.devices.get(id);
        }else {
            device = new Device({
                id,
                name
            })
            this.devices.set(id,device);
            device.on("traitUpdate",this.onDeviceTraitUpdate.bind(this,device))
            device.on("newTrait",this.onNewDeviceTrait.bind(this,device))
            device.on("traitSet",this.onDeviceTraitSet.bind(this,device))
            this.emit("newDevice",device);
        }
        for(let traitID in traits){
            device.updateTrait(traitID,traits[traitID])
        }

    }
    onDeviceTraitSet(device,{
        traitID,
        data
    }){
        let output = {
            id:device.id,
            traits:{}
        }
        output.traits[traitID] = data;
        this.server.send(JSON.stringify(output),6669,"255.255.255.255");
    }
    onDeviceTraitUpdate(device,trait){
        this.emit("deviceTraitUpdate",{
            device,
            trait
        })
    }
    onNewDeviceTrait(device,trait){
        this.emit("newDeviceTrait",{
            device,
            trait
        })
    }
}
class Device extends EventEmitter{
    constructor({
        id,
        name,
    }){
        super();
        this.id = id;
        this.name = name;
        this.lastUpdate = Date.now();
        this.traits = new Map();
    }
    updateTrait(traitID,data){
        if(this.traits.has(traitID)){
            this.traits.get(traitID).update(data);
        }else {
            if(Trait.has(traitID)){
                let trait = new (Trait.get(traitID))(data);
                this.traits.set(traitID,trait);
                trait.on('update',this.onTraitUpdate.bind(this,trait))
                trait.on('set',this.onTraitSet.bind(this,trait))
                this.onTraitUpdate(trait);
                this.emit("newTrait",trait);
            }else{
            }
        }
    }
    onTraitUpdate(trait){
        this.emit("traitUpdate",trait)
    }
    onTraitSet(trait,{
        traitID,
        data
    }){
        this.emit("traitSet",{
            traitID,
            data
        })
    }
}
class Trait extends EventEmitter{
    static reg(){
        this.traits.set(this.TraitID,this);
    }
    static get(traitID){
        return this.traits.get(traitID)
    }
    static has(traitID){
        return this.traits.has(traitID)
    }
    constructor(){
        super()
        this.traitID = this.constructor.TraitID;
    }
}
Trait.traits = new Map();
class Colour extends Trait{
    constructor({
        red = 0,
        green = 0,
        blue = 0
    }){
        super();
        this.red = red;
        this.green = green;
        this.blue = blue;
    }
    update({
        red = this.red,
        green = this.green,
        blue = this.blue
    }){
        if(red!=this.red || blue != this.blue|| green != this.green){
            this.red = red;
            this.blue = blue;
            this.green = green;
            this.emit("update");
            return true;
        }
        return false;
    }
    set({
        red = this.red,
        green = this.green,
        blue = this.blue
    }){
        this.emit("set",{
            traitID:"colour",
            data:{
                red,
                green,
                blue
            }
        });
    }
    export(){
        return {
            red:this.red,
            green:this.green,
            blue:this.blue
        }
    }
}
Colour.TraitID = "colour";
Colour.reg();
module.exports = {Socket};