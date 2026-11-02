class ResponsiveEvent{
    constructor(){
        this.events = {}
        this.CurrentlyDragging = ""
        this.PreviousDrag = ""
    }
    initEvent(element,draggablelabel,dragId,dropId,button = element,transforms = ["translate(0px,0px)","scale(1)","rotate(0deg)"],enableEventButtonIds = [0]){                     
       let event = new DragDrop(element,button,draggablelabel)
       button.draggable = true
       event.drag_btn.classList.add(draggablelabel)
       this.events[element.id] = event
       this.events[element.id].transforms = transforms
       this.events[element.id].enableEventButtonIds = [...enableEventButtonIds]
       element.style.transform = transforms.join(" ")
       let moveEvent = new CustomEvent("ResponsiveDragMove",{detail:{}})
       event.Dragmove(elem =>{
          moveEvent.detail["element"] = elem
          event.drag_btn.dispatchEvent(moveEvent)
       });
       let startEvent = new CustomEvent("ResponsiveDragStart",{detail:{tag:dragId}})
       event.SecureDrag()
       ResEvent.enableEvent(element,"move")
       ResEvent.enableEvent(element,"cancel")
       event.Dragstart(dragId,elem =>{          
       startEvent.detail["element"] = elem
       event.drag_btn.dispatchEvent(startEvent)       
       }); 
       let counterEnter = 1
       let counterLeave = 1   
       let dragcancelEvent = new CustomEvent("ResponsiveDragCancel",{detail:{dragElement:null,dragButton:null,dropElement:null}})
       event.DragCancel(dropId,(dragelem,button,dropElem) =>{
         counterEnter = 1
         counterLeave = 1
         dragcancelEvent.detail.dragElement = dragelem
         dragcancelEvent.detail.dragButton = button
         if(dropElem){
           dragcancelEvent.detail.dropElement = dropElem
         }
         event.drag_btn.dispatchEvent(dragcancelEvent)
       })  
       let dropEvent = new CustomEvent("ResponsiveDrop",{detail:{drag:null,drop:null}})
       event.Drop(dropId,(dragelem,dropelem) =>{
        counterEnter = 1
        counterLeave = 1
        dropEvent.detail.drag = dragelem
        dropEvent.detail.drop = dropelem    
        event.drag_btn.dispatchEvent(dropEvent)
       });
       
       let enterEvent = new CustomEvent("ResponsiveDragEnter",{detail:{enterElement:null}})
       ResEvent.enableEvent(element,"leave")
       event.Enter(dropId,enterelem =>{ 
        counterLeave = 1 
        enterEvent.detail.enterElement = enterelem
        if(counterEnter == 1){
          event.drag_btn.dispatchEvent(enterEvent)
        }  
        counterEnter++
       })
       let leaveEvent = new CustomEvent("ResponsiveDragLeave",{detail:{leaveElement:null}})
       ResEvent.enableEvent(element,"enter")
       event.Leave(dropId,leaveelem =>{ 
        counterEnter = 1
        leaveEvent.detail.leaveElement = leaveelem
        if(counterLeave == 1){
          event.drag_btn.dispatchEvent(leaveEvent)
        } 
        counterLeave++
       })
       let overEvent = new CustomEvent("ResponsiveDragOver",{detail:{overElement:null}})
       event.Over(dropId,overelem =>{
         overEvent.detail.overElement = overelem
         event.drag_btn.dispatchEvent(overEvent)
       })
       let dragendEvent = new CustomEvent("ResponsiveDragEnd")
       event.DragEnd(() =>{
         event.drag_btn.dispatchEvent(dragendEvent)
       })
    }
    enableEvent(element,event){
       this.events[element.id].enabled[event] = true
    }
    disableEvent(element,event){
      let opp = {
        enter: "leave",
        leave: "enter"
      }
      let oppEvent = this.events[element.id].enabled[opp[event]]
      if((event == "enter" || event == "leave") && oppEvent){
        //console.warn("The enter and leave events are interconnected, if you disable one of these events, the other will not work properly.")     
      }
      if(event != "cancel" && event != "move"){
        //console.warn(`The ${event} event was disabled!`)
        this.events[element.id].enabled[event] = false
      }       
    }
    getNums(type,element){
      if(type){
      let cors;
      this.events[element.id].transforms.forEach(transform =>{
        if(transform.indexOf(type) != -1){
          let parOpenindex = transform.indexOf("(") + 1
          let parCloseindex = transform.indexOf(")")
      cors = transform.slice(parOpenindex,parCloseindex).split(",").map(elem =>{
      return parseFloat(elem)
      })  
        }
      })
      return cors 
      }
      return ""
    }
    getTransform(type){
      if(type){
      let element;
      this.events[element.id].transforms.forEach(transform =>{
        if(transform.includes(type)){
          element = transform
        }
      })
      return element
      }
      return ""
    }
    createTransformation(coordinates,element){
      let transformation = ""
      let create = {
        translate: (x,y) =>{ return `translate(${x}px,${y}px) `},
        scale : (s,x) =>{ return `scale(${s}) `},
        rotate: (r,x) =>{ return `rotate(${r}deg) `}
      }
      this.events[element.id].transforms.forEach(item =>{        
        let end = item.indexOf("(")
        let type = item.slice(0,end)
        transformation += create[type](coordinates[type][0],coordinates[type][1])
      })
      return transformation
    }
    calculateCenter(element,button,StartX,StartY,event){
      let left = element.getBoundingClientRect().left 
      let top = element.getBoundingClientRect().top
      let elemwidth = element.getBoundingClientRect().width
      let elemheight = element.getBoundingClientRect().height
      let btnLeft = button.getBoundingClientRect().left
      let btntop = button.getBoundingClientRect().top
      let btnwidth = button.getBoundingClientRect().width
      let btnheight = button.getBoundingClientRect().height
      let coordinates = ResEvent.getNums("translate",element)
      let scale = ResEvent.getNums("scale",element)     
      let rotate = ResEvent.getNums("rotate",element)
      let calculate = {
        elementCenter: ()=>{
          let x = left + (elemwidth / 2)
          let y = top + (elemheight / 2)
          return {x,y}
        },
        buttonCenter:()=>{
          let x = calculate.elementCenter().x - (calculate.elementCenter().x - btnLeft) + (btnwidth / 2) 
          let y = calculate.elementCenter().y - (calculate.elementCenter().y - btntop) + (btnheight / 2)
          return {x,y}
        },
        distance: ()=>{
          let x = (calculate.buttonCenter().x - StartX)
          let y = (calculate.buttonCenter().y - StartY) 
          return {x,y}         
        },
        finalCoords: ()=>{
          let finalplaceX = coordinates[0] - calculate.distance().x 
          let finalplaceY = coordinates[1] - calculate.distance().y
          return {finalplaceX,finalplaceY}
        }    
      }
      return calculate.finalCoords()
    }
}

class DragDrop{
    constructor(element,button = element,draggablelabel){
        this.dragId;
        this.dropId;
        this.drag_btn = button
        this.my_id = element
        this.parent = this.my_id.parentNode
        this.StartX;
        this.StartY;
        this.buttonX;
        this.buttonY;
        this.newX;
        this.newY;
        this.startPos;
        this.dropParent = null;
        this.default_zIndex;
        this.zIndex;
        this.zoomLevel;
        this.draggablelabel = draggablelabel
        this.draggablestate;
        this.over;
        this.enter;
        this.leave = this.parent
        this.previousEntrance;
        this.enabled = {start:false,move:false,drop:false,enter:false,leave:false,over:false,end:false,cancel:false}
        this.data;
        this.insidePage;
        this.transforms;
        this.enableEventButtonIds = []
    }
    SecureDrag(){
        let items = ["-webkit-touch-callout","-webkit-user-drag","user-select"]
        items.forEach(item =>{
            this.my_id.style.setProperty(item,"none")
                if(this.my_id.id != this.drag_btn.id){
                  this.drag_btn.style.setProperty(item,"none")
                }                       
        })
    }
   Dragstart(dragId,callback){
    this.dragId = dragId
    this.drag_btn.addEventListener("pointerdown",(e)=>{
        if(!this.enableEventButtonIds.includes(e.button)) return
        if(this.drag_btn.classList.contains(this.draggablelabel) && this.drag_btn.draggable && this.enabled.start){
            ResEvent.CurrentlyDragging = this.my_id
            if(ResEvent.PreviousDrag == ""){
              ResEvent.PreviousDrag = this.my_id
            }     
            this.default_zIndex = this.my_id.style.zIndex
            this.my_id.style.zIndex = "1000"
            this.parent = this.my_id.parentNode
            this.startPos = ResEvent.getNums("translate",this.my_id)
            this.drag_btn.classList.add(this.dragId)
            if(e.cancelable && this.drag_btn.classList.contains(this.dragId)){
              e.preventDefault()
            }
            this.StartX = e.clientX 
            this.StartY = e.clientY
            let finalcoords = ResEvent.calculateCenter(this.my_id,this.drag_btn,this.StartX,this.StartY,e)
            let finalplaceX = finalcoords.finalplaceX
            let finalplaceY = finalcoords.finalplaceY
            this.buttonX = finalplaceX
            this.buttonY = finalplaceY       
            let transform = ResEvent.createTransformation({translate:[finalplaceX,finalplaceY],scale:[ResEvent.getNums("scale",this.my_id)],rotate:[ResEvent.getNums("rotate",this.my_id)]},this.my_id)
            this.my_id.style.transform = transform 
            callback(this.my_id)
        }
    },{passive:false})
    }
    Dragmove(callback){
    document.addEventListener("pointermove",(e)=>{
        let mouseX = e.clientX
        let mouseY = e.clientY    
    if(this.drag_btn.classList.contains(this.dragId) && this.drag_btn.classList.contains(this.draggablelabel) && this.drag_btn.draggable && this.enabled.move){
         e.preventDefault()   
        if(mouseX > 0 && mouseX < window.innerWidth - 1){  
        this.newX = this.buttonX + (e.clientX - this.StartX)
        }
        if(mouseY > 0 && mouseY < window.innerHeight - 1){
        this.newY = this.buttonY + (e.clientY - this.StartY)
        }    
        let transform = ResEvent.createTransformation({translate:[this.newX,this.newY],scale:[ResEvent.getNums("scale",this.my_id)],rotate:[ResEvent.getNums("rotate",this.my_id)]},this.my_id)
        this.my_id.style.transform = transform //`translate(${this.newX}px,${this.newY}px) scale(${ResEvent.getNums("scale")}) rotate(${ResEvent.getNums("rotate")}deg)`
        callback(this.my_id)
    }   
    })
    this.my_id.addEventListener("pointermove",(e)=>{
    if(this.drag_btn.classList.contains(this.dragId) && this.drag_btn.classList.contains(this.draggablelabel) && this.drag_btn.draggable && this.enabled.move){
         e.preventDefault()
        let mouseX = e.clientX
        let mouseY = e.clientY
        if(mouseX > 0 && mouseX < window.innerWidth - 1){    
        this.newX = this.buttonX + (e.clientX - this.StartX)
        }
        if(mouseY > 0 && mouseY < window.innerHeight - 1){
        this.newY = this.buttonY + (e.clientY - this.StartY)
        }
        let transform = ResEvent.createTransformation({translate:[this.newX,this.newY],scale:[ResEvent.getNums("scale",this.my_id)],rotate:[ResEvent.getNums("rotate",this.my_id)]},this.my_id)
        this.my_id.style.transform = transform //`translate(${this.newX}px,${this.newY}px) scale(${ResEvent.getNums("scale")}) rotate(${ResEvent.getNums("rotate")}deg)`       
        callback(this.my_id)
    }  
    })
    window.addEventListener("touchmove", e =>{
    if(e.cancelable && this.drag_btn.classList.contains(this.dragId)){
      e.preventDefault()
    }
    let target = document.elementFromPoint(e.targetTouches[0].clientX,e.targetTouches[0].clientY)
    if(target){
     let index = target.style.zIndex ? target.style.zIndex : 0
    if(index){
      this.my_id.style.zIndex = index + 1
    } 
    }    
    this.newX = this.buttonX + (e.targetTouches[0] - this.StartX)
    this.newY = this.buttonY + (e.targetTouches[0] - this.StartY)
    let transform = ResEvent.createTransformation({translate:[this.newX,this.newY],scale:[ResEvent.getNums("scale",this.my_id)],rotate:[ResEvent.getNums("rotate",this.my_id)]},this.my_id)
    this.my_id.style.transform = transform //`translate(${this.newX}px,${this.newY}px) scale(${ResEvent.getNums("scale")}) rotate(${ResEvent.getNums("rotate")}deg)`  
    callback(this.my_id)
    },{passive:false}) 
   }
   Drop(dropId,callback){
    this.dropId = dropId
    this.drag_btn.addEventListener("pointerup",(e)=>{
        if(!this.enableEventButtonIds.includes(e.button)) return
        e.preventDefault()
        this.dropParent = parent.id  
        let isSame = this.my_id == this.drag_btn ? true : false
        if(this.drag_btn.classList.contains(this.draggablelabel) && this.drag_btn.draggable && this.enabled.drop){
        this.drag_btn.classList.remove(this.dragId)
        this.my_id.style.visibility = "hidden" 
        let belowId = document.elementFromPoint(e.clientX,e.clientY)
        this.my_id.style.visibility = "visible"
        if(belowId){
          let transform = ResEvent.createTransformation({translate:[ResEvent.getNums("translate",this.my_id)[0],ResEvent.getNums("translate",this.my_id)[1]],scale:[ResEvent.getNums("scale",this.my_id)],rotate:[ResEvent.getNums("rotate",this.my_id)]},this.my_id)
         if((!belowId.classList.contains(dropId) || this.parent.id == belowId.id) && !belowId.parentNode.classList.contains(dropId)){  
            this.drag_btn.classList.remove(this.dragId)
               this.my_id.style.transform = transform//this.startPos + `scale(${ResEvent.getNums("scale")})` + `rotate(${ResEvent.getNums("rotate")}deg)`
               this.dropParent = null

        }else if(belowId.classList.contains(dropId)){
            this.dropParent = belowId
            this.my_id.style.transform = transform //ResEvent.getTransform("translate") + `scale(${ResEvent.getNums("scale")})` + `rotate(${ResEvent.getNums("rotate")}deg)`
        }else if(belowId.parentNode.classList.contains(dropId) && isSame){
            this.dropParent = belowId.parentNode
            this.my_id.style.transform = transform
        }
        }  
        this.my_id.style.zIndex = this.default_zIndex
        if(this.my_id && this.dropParent){
          ResEvent.CurrentlyDragging = ""
          ResEvent.PreviousDrag = this.my_id
         callback(this.my_id,this.dropParent)    
        }           
        }
    },{passive:false})  
   } 
   Enter(dropId,callback){
    document.addEventListener("pointermove",(e)=>{     
        if(this.drag_btn.classList.contains(this.dragId) && this.drag_btn.classList.contains(this.draggablelabel) && this.drag_btn.draggable && this.enabled.enter){
            this.my_id.style.visibility = "hidden" 
        let belowId = document.elementFromPoint(e.clientX,e.clientY)
        this.my_id.style.visibility = "visible"          
            if(belowId && belowId.classList.contains(dropId)){
              this.previousEntrance = this.enter
                callback(belowId)               
            }
            this.enter = belowId          
        }          
    })      
   }
   Leave(dropId,callback){
        document.addEventListener("pointermove",(e)=>{    
        if(this.drag_btn.classList.contains(this.dragId) && this.drag_btn.classList.contains(this.draggablelabel) && this.drag_btn.draggable && this.enabled.leave){
            this.my_id.style.visibility = "hidden" 
            let belowId = document.elementFromPoint(e.clientX,e.clientY)
            this.my_id.style.visibility = "visible"  
            if(this.previousEntrance){
              if(belowId && belowId != this.previousEntrance && this.previousEntrance.classList.contains(dropId)){
              callback(this.leave)
            }
            this.leave = this.previousEntrance
            }           
        }     
    }) 
   }
   Over(dropId,callback){
    document.addEventListener("pointermove",(e)=>{ 
      if(this.drag_btn.classList.contains(this.dragId) && this.drag_btn.classList.contains(this.draggablelabel) && this.drag_btn.draggable && this.enabled.over){
        this.my_id.style.visibility = "hidden" 
        let belowId = document.elementFromPoint(e.clientX,e.clientY)
        this.my_id.style.visibility = "visible"    
        if(belowId && belowId.classList.contains(dropId)){
            callback(belowId)
        }  
      }    
   })
   }
   DragEnd(callback){
    this.my_id.addEventListener("pointerup",(e)=>{
        if(!this.enableEventButtonIds.includes(e.button)) return
        if(this.drag_btn.draggable && this.enabled.end){
          ResEvent.PreviousDrag = this.my_id
          callback()
        }
    })
     document.addEventListener("pointerup",(e)=>{
        if(!this.enableEventButtonIds.includes(e.button)) return
        let isElem = ResEvent.PreviousDrag == this.my_id ? true : false
        let mouseX = e.clientX
        let mouseY = e.clientY
        let outOfBounds = ((mouseX <= 0 || mouseX >= window.innerWidth - 1)) || ((mouseY <= 0 || mouseY >= window.innerHeight - 1))
        if(this.drag_btn.draggable && this.enabled.end && outOfBounds && isElem){
         callback()
        }
     })  
    }
   DragCancel(dropId,callback){
    document.addEventListener("pointerup",(e)=>{
        if(!this.enableEventButtonIds.includes(e.button)) return
        if(this.drag_btn.classList.contains(this.draggablelabel) && this.drag_btn.draggable && this.enabled.cancel){
            let mouseX = e.clientX
            let mouseY = e.clientY
            let transform = ResEvent.createTransformation({translate:[ResEvent.getNums("translate",this.my_id)[0],ResEvent.getNums("translate",this.my_id)[1]],scale:[ResEvent.getNums("scale",this.my_id)],rotate:[ResEvent.getNums("rotate",this.my_id)]},this.my_id)
           if(((mouseX <= 0 || mouseX >= window.innerWidth - 1)) || ((mouseY <= 0 || mouseY >= window.innerHeight - 1))){
            this.my_id.style.transform = transform //this.startPos + `scale(${ResEvent.getNums("scale")})` + `rotate(${ResEvent.getNums("rotate")}deg)`
            this.drag_btn.classList.remove(this.dragId)
            this.dropParent = null
            this.my_id.style.transform = transform //ResEvent.getTransform("translate") + `scale(${ResEvent.getNums("scale")})` + `rotate(${ResEvent.getNums("rotate")}deg)`   
            if(ResEvent.CurrentlyDragging){
            if(ResEvent.CurrentlyDragging.id == this.my_id.id){
              setTimeout(()=>{
                ResEvent.CurrentlyDragging = "" 
                ResEvent.PreviousDrag = this.my_id
              },0)            
              let dropAttempt = this.my_id.parentNode
              let target = null;
              this.my_id.style.zIndex = this.default_zIndex
              if(dropAttempt.classList){
                 target = dropAttempt.classList.contains(dropId) ? dropAttempt : null 
              }      
              callback(this.my_id,this.drag_btn,target)
            } 
            } 
           }
        }
    })
     this.drag_btn.addEventListener("pointerup",(e)=>{
      if(!this.enableEventButtonIds.includes(e.button)) return
      this.my_id.style.visibility = "hidden" 
       let belowId = document.elementFromPoint(e.clientX,e.clientY)
       this.my_id.style.visibility = "visible"
       if(belowId){
        let dropEnabled = ResEvent.events[this.my_id.id].enabled.drop
         if(!belowId.classList.contains(dropId) || this.parent.id == belowId.id || (belowId.classList.contains(dropId) && !dropEnabled)){  
            this.drag_btn.classList.remove(this.dragId)
            let transform = ResEvent.createTransformation({translate:[ResEvent.getNums("translate",this.my_id)[0],ResEvent.getNums("translate",this.my_id)[1]],scale:[ResEvent.getNums("scale",this.my_id)],rotate:[ResEvent.getNums("rotate",this.my_id)]},this.my_id)
               this.my_id.style.transform = transform //this.startPos + `scale(${ResEvent.getNums("scale")})` + `rotate(${ResEvent.getNums("rotate")}deg)`
               this.dropParent = null
               this.my_id.style.transform = transform//ResEvent.getTransform("translate") + `scale(${ResEvent.getNums("scale")})` + `rotate(${ResEvent.getNums("rotate")}deg)`
               setTimeout(()=>{
               ResEvent.CurrentlyDragging = ""
               ResEvent.PreviousDrag = this.my_id
               },0)
               let dropAttempt = belowId.parentNode
               let target = null;
               if(dropAttempt.classList){
                target = dropAttempt.classList.contains(dropId) ? dropAttempt : null 
               }
               callback(this.my_id,this.drag_btn,target)
        }
        } 
     })
   }
}

var ResEvent = new ResponsiveEvent()