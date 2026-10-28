function Draggable(buttonId,elementId,draggingId,colorStart,colorEnd,element2Id){
    var drag_btn = document.getElementById(buttonId)
    let my_id = document.getElementById(elementId)
    my_id.style.transform = "translate(0px,0px)"
    let elem2 = document.getElementById(element2Id)
    let defaultindex1 = my_id.style.zIndex
    let defaultindex2 = elem2.style.zIndex
    let StartX;
    let StartY;
    let buttonX;
    let buttonY;
    let newX;
    let newY;
    drag_btn.addEventListener("pointerdown",(e)=>{
    drag_btn.style.backgroundColor = colorStart
    my_id.style.zIndex = 999
    elem2.style.zIndex = defaultindex2
    drag_btn.classList.add(draggingId)
    e.preventDefault()   
      StartX = e.clientX 
      StartY = e.clientY 
      let left = my_id.getBoundingClientRect().left 
      let top = my_id.getBoundingClientRect().top 
      let distanceX = left + (drag_btn.clientWidth / 2) - StartX
      let distanceY = top + (drag_btn.clientHeight / 2) - StartY
      let currpos = my_id.style.transform
      let cors = currpos.slice(10,currpos.length-1).split(",").map(elem =>{
        return parseInt(elem.slice(0,elem.length - 2))
      })      
      let finalplaceX = cors[0] - distanceX
      let finalplaceY = cors[1] - distanceY       
      buttonX = finalplaceX
      buttonY = finalplaceY 
      my_id.style.transform = `translate(${finalplaceX}px,${finalplaceY}px)` 
    })
    document.addEventListener("pointermove",(e)=>{
      if(drag_btn.classList.contains(draggingId)){
         e.preventDefault()
        let mouseX = e.clientX
        let mouseY = e.clientY
        if(mouseX > 0 && mouseX < window.innerWidth - 1){
           newX = buttonX + (e.clientX - StartX)
        }    
        if(mouseY > 0 && mouseY < window.innerHeight - 1){
           newY = buttonY + (e.clientY - StartY)
        }       
        my_id.style.transform = `translate(${newX}px,${newY}px)`  
    }  
    })
    drag_btn.addEventListener("pointermove",(e)=>{
    if(drag_btn.classList.contains(draggingId)){
      e.preventDefault()
      let mouseX = e.clientX
      let mouseY = e.clientY
      if(mouseX > 0 && mouseX < window.innerWidth - 1){
      newX = buttonX + (e.clientX - StartX)
      }
      if(mouseY > 0 && mouseY < window.innerHeight - 1){
      newY = buttonY + (e.clientY - StartY)
      }
      my_id.style.transform = `translate(${newX}px,${newY}px)`
    }
    })
    drag_btn.addEventListener("touchmove",(e)=>{
    if(drag_btn.classList.contains(draggingId)){
    e.preventDefault()
    newX = buttonX + (e.targetTouches[0] - StartX)
    newY = buttonY + (e.targetTouches[0] - StartY)
    my_id.style.transform = `translate(${newX}px,${newY}px)` 
    }
    }) 
    drag_btn.addEventListener("pointerup",(e)=>{
        drag_btn.classList.remove(draggingId)
        drag_btn.style.backgroundColor = colorEnd
    })
}
Draggable("movebtn","resultpopup","dragging","red","green","details")