import { getUserData } from "@decentraland/Identity"
import { getParcel } from "@decentraland/ParcelIdentity"
import { signedFetch } from "@decentraland/SignedFetch"
import { CHECK_VALID, CLEAR_UI, NeatSystem, TimerSystem } from "./system"
import { imageTexture, inputcode, neatBG, neatBGTexture, neatCode, neatInput, neatText } from "./ui"


export let code = ""
export let clicked = false
export let starTime = 0
export let endTime = 0
export let verified = false

export class Neat extends Entity{
    neatImage: Entity
    neat:Entity
    test:any
    action:any
    hideAvatar: any
    clicked = false
    id: any
    rotate = false
    distance = 1

    constructor(){
        super('neat')
        engine.addEntity(this)

        this.neat = new Entity(this.name + '-badge-')
        this.neat.addComponent(new Transform({rotation:Quaternion.Euler(0,0,180), scale: new Vector3(1.1,1.1,1.1)}))

        this.neat.addComponent(new Material())
        this.neat.getComponent(Material).albedoTexture = neatBGTexture
        this.neat.getComponent(Material).emissiveTexture = neatBGTexture
        this.neat.getComponent(Material).alphaTexture = new Texture("https://lsnft.mypinata.cloud/ipfs/QmfWDq5ar6oYXUEMJSNNYhxZVdLRZSL45Drw49iBPfXVbz")
        this.neat.getComponent(Material).emissiveIntensity = 1.2
        this.neat.getComponent(Material).emissiveColor = Color3.White()
        this.neat.getComponent(Material).metallic = 1

      this.neatImage = new Entity()
      this.neatImage.addComponent(new Material())
      this.neatImage.addComponent(new Transform({
        position: new Vector3(0,.15,-.01),
        rotation: Quaternion.Euler(0,0,180),
        scale: new Vector3(.55,.55,.55)
      }))
      this.neatImage.setParent(this)

    }

    async init(authCode: string, localAdmin:boolean, hideAvatar:boolean, rotate: boolean, clickDistance:number, transform: TranformConstructorArgs, hud?:any){
      this.test = localAdmin
      this.hideAvatar = hideAvatar
      this.rotate = rotate
      clickDistance ? this.distance = clickDistance : null

      this.addComponentOrReplace(new Transform(transform))

      const confirm = new UIImage(neatBG, imageTexture)
      confirm.sourceLeft = 0
      confirm.sourceTop = 0
      confirm.sourceWidth = 179
      confirm.sourceHeight = 66
      confirm.height = 33
      confirm.width = 90
      confirm.hAlign = "center"
      confirm.vAlign = "center"
      confirm.positionY = -30
      confirm.onClick = new OnClick(()=>{
          checkCode(this.id, neatCode.value, this)
      })

      await this.create()
      if(hud){
        hud.attachToEntity(this)
      }
  }

    async create(){
      log('test is', this.test)
        if(this.test){
            this.neat.setParent(this)
            this.neat.addComponent(new PlaneShape())
            this.neatImage.addComponent(new PlaneShape())
            this.neatImage.getComponent(Material).alphaTexture = new Texture("https://lsnft.mypinata.cloud/ipfs/QmVjDnBstjvuLuoF7sEi2SZc7YZUbvxfajuFXpr5fuAiU6/circle_mask.png")

        }
        else{
            engine.addSystem(new TimerSystem(this.neat, this))
            let data = await getData()
            if(data != ""){
              starTime = data.start
              endTime = data.end
              this.id = data.id
      
              engine.addSystem(new NeatSystem(5, CHECK_VALID,this, true))
              
              let text = new Texture(data.image)
              this.neat.addComponent(new PlaneShape())
              this.neatImage.addComponent(new PlaneShape())
              this.neatImage.getComponent(Material).alphaTexture = new Texture("https://lsnft.mypinata.cloud/ipfs/QmVjDnBstjvuLuoF7sEi2SZc7YZUbvxfajuFXpr5fuAiU6/circle_mask.png")
              this.neatImage.getComponent(Material).albedoTexture = text
              this.neatImage.getComponent(Material).emissiveTexture = text
              this.neatImage.getComponent(Material).emissiveIntensity = 1.5
              this.neatImage.getComponent(Material).emissiveColor = Color3.White()

              this.neatImage.addComponent(new OnPointerDown(()=>{
                if(!clicked){
                  clicked = true
                  neatCode.value = getCode()        
                  neatBG.visible = true
                }
              }, {distance: this.distance, showFeedback:true, hoverText: "Click for NEAT"}))
            }
            else{
              log('data is false')
              engine.removeEntity(this)
            }
        }
        
        if(this.rotate){
          engine.addSystem(this)
        }

        if(this.hideAvatar){
          this.neat.addComponent(
            new AvatarModifierArea({
              area: { box: new Vector3(6, 4, 6) },
              modifiers: [AvatarModifiers.HIDE_AVATARS],
            })
          )
        }
    }

    update(){
        let rot = this.getComponent(Transform).rotation.eulerAngles.clone()
        this.getComponent(Transform).rotation = Quaternion.Euler(rot.x, rot.y + 1, rot.z)
      }
}

export function verify(){
    verified = true
}

export let neat = new Neat()

export let claimlink = "https://lkdcl.co/neat"

export function getCode(){
    let code = ""
    for(var i = 0; i < 4; i++){
      code += chars[Math.floor(Math.random() * ((chars.length-1) - 0 + 1) + 0)]
    }
    return code
  }

export function checkCode(id:string, ecode:string, neat:Neat){
    log('neat input', inputcode)
    log('ecode', ecode)
    if(inputcode == ecode){
      log('we are correct input')
      claimNeat(id, neat)
      neatBG.visible = false
    }
    else{
      log('code incorrect')
      neatBG.visible = false
      showMessage('Incorrect Code', 5, CLEAR_UI, null)
      neatInput.value = ""
    }
  }

  export async function claimNeat(id:string, neat:Entity){
    let userData = await getUserData()
    if(userData?.hasConnectedWeb3){
      log('attempting to claim')
  
      try{
        const parcel = await getParcel()

        let baseParcel = parcel.land.sceneJsonData.scene.base
        let response = await signedFetch(claimlink + "/dcl/claim?id=" + id + "&base=" + baseParcel)
        let json
        if (response.text) {
          json = await JSON.parse(response.text)
          log(json)
        }
    
        if (json && json.valid) {
          log("we have valid request")
          if(json.claim){
            log('we claimed')
            showMessage("NEAT Claimed!", 5, CLEAR_UI, null)
          //  ui.displayAnnouncement("NEAT claimed!")
          }
        }
        else{
          log('invalid request =>', json.reason)
          showMessage("Error: " + json.reason, 5, CLEAR_UI, null)
          //ui.displayAnnouncement("Error: " + json.reason)
        }
        engine.removeEntity(neat)
      }
      catch(errr){
        log('error =>', error)
        showMessage("Error: " + errr, 5, CLEAR_UI, null)
      }

    }
    else{
      showMessage("Error: WEB3 not enabled", 5, CLEAR_UI, null)
    }
  }

  export function showMessage(
    message: string,
    time: number,
    action: string,
    entity: any
  ) {
    neatText.visible = true
    neatText.value = message
    engine.addSystem(new NeatSystem(time, action, entity, false))
  }

  export async function getData(){
    let userData = await getUserData()
    if(userData?.hasConnectedWeb3){
      log('attempting to get image')

      const parcel = await getParcel()
      log('base parcel: ', parcel.land.sceneJsonData.scene.base)
      let base = parcel.land.sceneJsonData.scene.base
      let temp = base.split(',')      

      try{
        let response = await fetch(claimlink + "/getneat?x=" + temp[0] + "&y=" + temp[1])
        let j = await response.json()
        log('getting neat data', j)
        if(j.valid){
          if(j.data.start){
            return j.data 
          }
          else{
            return ""
          }

        }
      }
      catch(e){
        log('error =>', error)
      }
    }
    else{
      return ""
    }
  }



let chars = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
]