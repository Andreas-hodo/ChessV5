class Game{
  #board;
  #players;
  #timers;
  #details;
  #arrows = []
  #counter = 3;
  #Ended = false
  constructor(board,players,timers,details){
    this.#board = board;
    this.#players = players;
    this.#timers = timers;
    this.#details = details;
  }
  getBoard(){
    return this.#board;
  }
  getPlayers(){
    return this.#players;
  }
  getTimers(){
    return this.#timers;
  }
  getDetails(){
    return this.#details;
  }
  getArrows(){
    return [...this.#arrows];
  }
  removeArrow(index){
    if(index >= -1) this.#arrows.splice(index,1)
  }
  updateArrows(arrow){
    this.#arrows.push(arrow)
  }
  getPlayer(color){
    let id = color == "white" ? "player2" : color == "black" ? "player1" : null
    return this.getPlayers()[id]
  }
  getTimer(color){
    return this.getTimers()[color]
  }
  #updateCounter(){
    this.#counter++;
  }
  getCounter(){
    return this.#counter;
  }
  playAgain(){
    location.reload()
  }
  setEnded(val){
    this.#Ended = val
  }
  Ended(){
    return this.#Ended
  }
  Start(){}
  download(){}
  End(){}
  showResult(winner,reason){
    let msg = document.getElementById("winner")
    let finalres = document.getElementById("finalresult")
    msg.innerText = winner
    finalres.innerText = reason
    let respopup = document.getElementById("resultpopup")
    respopup.style.display = "flex"
    let finishSound = new Audio("https://andreas-hodo.github.io/Chess/Game/sounds/level-win-6416.mp3")
    if(game.getDetails().getSoundAllowed()) finishSound.play()
  }
}

class Board{
  #pieces;
  #squares;
  static #cordinates_x = [0,'a','b','c','d','e','f','g','h']
  static #cordinates_y = [0,1,2,3,4,5,6,7,8]
  clickedPiece = null
  draggingpiece = null
  #turn = "white"
  #flipData = {
    styles:[["row", "column-reverse", "row-reverse", "column"],["row"],["column","column","column","column","column","column","column","column"]],
    elements:[".cors","#chess_board",".column"],
    arrows:"rotate(0deg)"
  }
  #flipped = false 
  constructor(pieces,squares){
    this.#pieces = pieces;
    this.#squares = squares;
  }
  updateturn(){
    this.#turn = this.#turn == "white" ? "black" : "white"
  }
  getTurnTeam(){
    return this.#turn
  }
  getOppositeTeam(){
    return this.#turn == "white" ? "black" : "white"
  }
  getPieces(){
    return [...this.#pieces];
  }
  getSquares(){
    return [...this.#squares];
  }
  getPiece(name){
    return this.getPieces().filter(piece => {if(piece.getName() == name) return piece}).pop();
  }
  getSquare(name){
    return this.getSquares().filter(square => {if(square.getName() == name) return square}).pop();
  }
  static createSquares(){
    let pieces = [
      'rook_1w','pawn_1w','pawn_1b','rook_1b','knight_1w','pawn_2w','pawn_2b','knight_1b',
      'bishop_1w','pawn_3w','pawn_3b','bishop_1b','queen_w','pawn_4w','pawn_4b','queen_b',
      'king_w','pawn_5w','pawn_5b','king_b','bishop_2w','pawn_6w','pawn_6b','bishop_2b',
      'knight_2w','pawn_7w','pawn_7b','knight_2b','rook_2w','pawn_8w','pawn_8b','rook_2b'
    ]
    let piecesSquares = [
      'a1','a2','a7','a8','b1','b2','b7','b8',
      'c1','c2','c7','c8','d1','d2','d7','d8',
      'e1','e2','e7','e8','f1','f2','f7','f8',
      'g1','g2','g7','g8','h1','h2','h7','h8'
    ]
    let squares = []
    for(let i = 1; i <= 8; i++){
      for(let z = 1; z <= 8; z++){
      let [x,y] = [Board.#cordinates_x,Board.#cordinates_y]
      let squareId = x[i] + y[z]
      let pieceId = piecesSquares.includes(squareId) ? pieces[piecesSquares.indexOf(squareId)] : null
      let defColor = (i % 2 == 1 && z % 2 == 0) || (i % 2 == 0 && z % 2 == 1) ? "white" : "black"
      let currentSquare = new Square(squareId,defColor,defColor,i,z)
      currentSquare.disableLeftClick()
      //currentSquare.Click()    
      currentSquare.setpieceName(pieceId)
      squares.push(currentSquare)
      }
    }
    return squares
  }
  static createPieces(squares){
    let pieces = []
    for(let i = 0; i < squares.length; i++){
      let square = squares[i]
      let piecename = square.getpieceName()
      let piecedata = Piece.getData(piecename)
      let {x,y} = square.decode(square.getName())
      if(!piecename) continue
      let piece = this.CreatePiece(piecedata.color,piecename,square.getName(),piecedata.type,x,y)
      pieces.push(piece)     
    }
    return pieces
  }
  static CreatePiece(color,name,square,type,x,y){
    let piece;
    switch(type){
      case "rook":
        piece = new Rook(color,name,square,type,x,y)
        break
      case "knight":
        piece = new Knight(color,name,square,type,x,y)
        break
      case "bishop":
        piece = new Bishop(color,name,square,type,x,y)
        break
      case "queen":
        piece = new Queen(color,name,square,type,x,y)
        break
      case "king":
        piece = new King(color,name,square,type,x,y)
        break
      case "pawn":
        piece = new Pawn(color,name,square,type,x,y)
        break
    }
    return piece
  }
  #updateFlipped(){
   this.#flipped = !this.#flipped
  }
  getFlipped(){
   return this.#flipped
  }
  flip(){
   this.#flipData.styles.forEach((currstyles, i) => {
     let currElements = document.querySelectorAll(this.#flipData.elements[i])
     currElements.forEach((elem, j) => {
       let currentcor = this.#flipData.styles[i][j] 
       let newcor = currentcor.includes("-reverse") ? currentcor.replace("-reverse", "") : `${currentcor}-reverse`;
       elem.style.setProperty("flex-direction",newcor, "important");
       this.#flipData.styles[i][j] = newcor
     })
   });
   let arrowElem = document.querySelector("#chessboard")
   let newarrowsstyles = this.#flipData.arrows.includes("180deg") ? "rotate(0deg)" : "rotate(180deg)"
   arrowElem.style.setProperty("transform",newarrowsstyles, "important");
   this.#flipData.arrows = newarrowsstyles
   this.#updateFlipped()
  }
  // getCoordX(){
  //   return this.#cordinates_x
  // }
  // getCoordY(){
  //   return this.#cordinates_y
  // }
  setClickedPiece(element){
    this.clickedPiece = element
  }
  getClickedPiece(){
    return this.clickedPiece
  }
  setdraggingPiece(element){
    this.draggingpiece = element
  }
  getdraggingPiece(){
    return this.draggingpiece
  }
}

class Player{
  #name;
  #team;  
  #role = "user"
  #captured = [];
  #resigned = false;
  #DrawOffered = false;
  #DrawAccepted = false; 
  constructor(name,team,role){
    this.#setName(name)
    this.#setTeam(team)
    this.#setRole(role)
    if(role == "bot"){
      //this.initEngine()
      //if(team == "white") board.flip()
    }
    this.#loadName()
  }
  #setName(name){
    this.#name = name
  }
  getName(){
    return this.#name
  }
  #setTeam(team){
    this.#team = team
  }
  getTeam(){
    return this.#team
  }
  #setRole(role){
    this.#role = role
  }
  getRole(){
    return this.#role
  }
  #loadName(){}
  setresigned(val){
    this.#resigned = val
  }
  getresigned(){
    return this.#resigned
  }
  setDrawOffered(val){
    this.#DrawOffered = val
  }
  getDrawOffered(){
    return this.#DrawOffered
  }
  setDrawAccepted(val){
    this.#DrawAccepted = val
  }
  getDrawAccepted(){
    return this.#DrawAccepted
  }
  OfferDraw(){}
  #AcceptDraw(){}
}

class Timer{
  constructor(time,team){
    this.#time = time
    this.#team = team
    this.#loadTime()
  }
  #time;
  #team;
  #ended = false        
  #counter;
  handlevisibility;
  offline;
  online;
  getEnded(){
    return this.#ended
  }
  static focus(color){
    document.querySelectorAll(".timer").forEach(timer =>{ 
      if(timer.classList.contains(color)){
        timer.style.opacity = "1"
      }else{
        timer.style.opacity = "0.7"
      }
    })
  }
  #setTime(){
    let timer = document.getElementById(`timer_${this.#team}`)
    let [minutes,seconds] = [String(parseInt(this.#time / 60)).padStart(2,"0"),String(this.#time % 60).padStart(2,"0")]
    timer.innerText = `${minutes}:${seconds}`
    return timer
  }
  #loadTime(){
    this.#setTime()
  }
  #update(){
    if(game.Ended()) return
    this.#time--   
    this.End()  
    let timer = this.#setTime()    
    let beepSound = new Audio("https://andreas-hodo.github.io/Chess/Game/sounds/point-smooth-beep-230573.mp3")
    let opponentColor = this.#team == "white" ? "black" : "white"
    let low = this.#time <= 9
    timer.style.color = low && this.#time % 2 == 1 ? "red" : opponentColor
    if(game.getDetails().getSoundAllowed() && low) beepSound.play()
  }
  static balance(timer){
      if(game.Ended()) return
      let offtime = parseInt(timer.online / 1000 - timer.offline / 1000) - 1
      let availTime = timer.time - offtime > 0
      timer.time = availTime ? timer.time -= offtime : 1
      timer.start()
  }
  static handleState(){
    this.handlevisibility = () =>{
      let state = document.visibilityState === "hidden"
      let timer = game.getTimer(board.getTurnTeam())
        state ? Timer.Offline(timer) : Timer.Online(timer)
      } 
      let body = document
      body.addEventListener("visibilitychange",this.handlevisibility)   
    }
  start(){
    if(!this.#ended && !game.Ended()){
      this.#counter = setInterval(() =>{this.#update()},1000);
      let turn = board.getTurnTeam()
      Timer.focus(turn)
    }
  }
  stop(){if(!this.#ended && !game.Ended()) clearInterval(this.#counter)}
  remainingTime(){return this.#time}
  End(time = 0){
    if(this.#time > 0 && this.#time > time) return 
    this.stop()
    this.#ended = true
    let body = document
    body.removeEventListener("visibilitychange",this.handlevisibility)
    let winner = this.#team == "white" ? "Black" : "White"
    if(this.#time == 0) game.resultActions(`${winner} WON!`,`Time ended!`)
  }
  static Online(timer){
    let secs = new Date().getTime()
    timer.online = secs
    Timer.balance(timer)
  }
  static Offline(timer){ 
    timer.stop()    
    let secs = new Date().getTime()
    timer.offline = secs
  }
}

class Details{
  #fen = [0, 'rnbqkbnr', 'pppppppp', '8', '8', '8', '8', 'PPPPPPPP', 'RNBQKBNR', 'w', 'KQkq', '-', '0', '1']
  #stringFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  #isSoundAllowed = false
  constructor(){
    
  }
  setFen(fen){
   this.#fen = fen
  }
  getFen(){
   return this.#fen
  }
  setstrFen(fen){
   this.#stringFen = fen
  }
  getstrFen(){
   return this.#stringFen
  }
  setFenRow(index,rowData){
   this.#fen[index] = rowData
  }
  changesoundElement(){
    let volume = document.getElementById("volume")
    let tag = this.getSoundAllowed() ? "up" : "off"
    let othertag = tag == "up" ? "off" : "up"
    volume.classList.replace(`fa-volume-${othertag}`,`fa-volume-${tag}`)
  }
  changeSoundAllowed(){
    this.#isSoundAllowed = this.#isSoundAllowed ? false : true
    this.changesoundElement()     
  }
  getSoundAllowed(){
    return this.#isSoundAllowed
  }
  copyFen(){
   navigator.clipboard.writeText(this.getstrFen())
  }
  downloadGame(){game.download()}
}

class Arrows{
  arrows = []
  static init(){
    let boardElem = document.getElementById("chess_board"); 
    let isPointerDown = false; 
    let [startingSquare,targetSquare] = ["",""]; 
    boardElem.addEventListener("pointerdown", e =>{ 
      e.stopImmediatePropagation();
      if(e.button == 2){
        let target = e.target.classList.contains("pieces") ? e.target.parentNode : e.target
        startingSquare = target.id       
        isPointerDown = true       
      }                  
    }) 
    let code = 1
    document.body.addEventListener("keydown", e =>{
      code = e.key
    })
    boardElem.addEventListener("pointerup", e =>{ 
      e.preventDefault()
      e.stopImmediatePropagation();
      if(e.button == 2 && isPointerDown){
        let belowId = document.elementFromPoint(e.clientX,e.clientY)
        let target = belowId.classList.contains("pieces") ? belowId.parentNode : belowId      
        targetSquare = target.id                       
        let areVals = startingSquare && targetSquare ? true : false
        if(!areVals) return
        if(startingSquare == targetSquare) return
        let squares = `${startingSquare} ${targetSquare}`
        let concatedsquares = squares.replace(" ","-")
        let arrowIndex = game.getArrows().indexOf(squares.replace(" ",""))
        if(arrowIndex == -1){
          Arrows.drawMoves(concatedsquares,code);
          Arrows.update(squares.replace(" ",""))
        }else{
          Arrows.remove(arrowIndex,squares)
        }        
      }
    })
  }
  static clearArrows(){document.getElementById("arrows").innerHTML = ""}
  static update(arrowId){
    game.updateArrows(arrowId)
  }
  static remove(index,squares){
    let arrcont = document.getElementById("arrows")
    let arrow = document.getElementById(squares.replace(" ",""))
    if(arrcont && arrow) arrcont.removeChild(arrow)
    game.removeArrow(index)
  }
  static create(from,to,id,color = "green"){
    let arrowid = id.toString().replace(",","")
    const start = Arrows.squareToXY(from);
    const end = Arrows.squareToXY(to);
    if(start.x === 0 || start.y === 0 || end.x === 0 || end.y === 0) return;
    const [dx,dy] = [end.x - start.x,end.y - start.y];
    const distance = Math.hypot(dx, dy);
    if(distance === 0) return;
    const arrowLength = 38;
    const refX = 24;
    const ux = dx / distance;
    const uy = dy / distance;
    const [lineEndX,lineEndY] = [end.x - ux * (arrowLength - refX),end.y - uy * (arrowLength - refX)];
    const line = document.createElementNS("http://www.w3.org/2000/svg","line");
    line.id = arrowid
    const attributes = ["x1", "y1","x2", "y2","stroke","stroke-width","stroke-linecap","marker-end","opacity"];
    const values = [start.x, start.y,lineEndX, lineEndY,Arrows.getColorHex(color),"14","round",`url(#arrow-${color})`,"0.85"];
    attributes.forEach((attribute, i) => {line.setAttribute(attribute, values[i])});
    document.getElementById("arrows").appendChild(line);
  }
  static squareToXY(square) {
      const SQUARE = document.getElementById("a1").getBoundingClientRect().width;
      const file = square[0].toLowerCase();
      const rank = Number(square[1]);
      const insideBorders = (coord) =>{
        if(coord >= 1 && coord <= 8) return true      
        return false
      }
      const files = "abcdefgh";
      const x = files.indexOf(file) * SQUARE + SQUARE / 2;
      const y = (8 - rank) * SQUARE + SQUARE / 2;
      if(!insideBorders(files.indexOf(file)+1) || !insideBorders(9 - rank)) return {x:0,y:0}
      return {x, y};
  }
  static drawMoves(moves,code = 1) {
    const list = moves.split(",");
    list.forEach(move => {
        move = move.trim();
        const parts = move.split("-");
        if(parts.length !== 2) return;       
        const from = parts[0].trim();
        const to = parts[1].trim();
        const color = Arrows.getColor(code)
        Arrows.create(from,to,parts,color);
    });
  }
  static getColorHex(color) {
    const colors = {green:"#22c55e",red:"#ef4444",yellow:"#facc15",orange:"#ffa500"};
    return colors[color] || colors.green;
  }
  static getColor(code){
    let colorCode = code >= 1 && code <= 4 ? code - 1 : 0
    const colors = ["orange","green","yellow","red"];
    return colors[colorCode]
  }
}

class Square{
  #name
  #color
  #defaultcolor
  #defaultrgb
  #x
  #y
  #pieceName
  constructor(name,color,defaultcolor,x,y){
    this.#setName(name)
    this.#setColor(color)
    this.#setDefaultColor(defaultcolor)
    this.#setx(x)
    this.#sety(y) 
    this.#setdefaultrgb()
  }
  disableLeftClick(){
    let element = document.getElementById(this.getName())
    element.addEventListener("contextmenu",e =>{e.preventDefault()})
  }
  #setName(name){
    this.#name = name
  }
  getName(){
    return this.#name
  }
  #setColor(color){
    this.#color = color
  }
  getColor(){
    return this.#color
  }
  #setDefaultColor(defaultcolor){
    this.#defaultcolor = defaultcolor
  }
  getDefaultColor(){
    return this.#defaultcolor
  }
  #setx(x){
    this.#x = x
  }
  getx(){
    return this.#x
  }
  #sety(y){
    this.#y = y
  }
  gety(){
    return this.#y
  }
  setpieceName(piecename){
    this.#pieceName = piecename
  }
  getpieceName(){
    return this.#pieceName
  }
  #setdefaultrgb(){
    this.#defaultrgb = this.getDefaultColor() == "white" ? "rgb(240, 201, 150)" : "rgb(100, 75, 43)"
  }
  getdefaultrgb(){
    return this.#defaultrgb
  }
  getCoords(){
    return [this.getx(),this.gety()]
  }
  static encode(x,y){
    return board.getCoordX()[x] + board.getCoordY()[y]
  }
  decode(){
    let x = this.getx()
    let y = this.gety()
    return {x,y}
  }
  applyColor(color){
    this.#color = color
    let element = document.getElementById(this.getName())
    element.style.backgroundColor = color
  }
  removeColor(){
    this.#color = this.#defaultcolor
    let element = document.getElementById(this.getName())
    element.style.backgroundColor = this.getdefaultrgb()
  }
  hasPiece(){
    return this.#pieceName ? true : false
  }
  hasEnemyPiece(pieceColor){
    if(!this.hasPiece()) return 
    let piece = game.getBoard().getPiece(this.getpieceName())
    return piece.getColor() != pieceColor ? true : false
  }
  hasSpecificPiece(piecetype,pieceColor){
    let piece = game.getBoard().getPiece(this.getpieceName())
    if(!this.hasPiece()) return 
    return piece.getType() == piecetype && piece.getColor() == pieceColor ? true : false
  }
  static exists(x,y){
    return (x >= 1 && x <= 8) && (y >= 1 && y <= 8)
  }
}

class Piece{
  #color
  #name
  #square
  #type
  #x
  #y
  #defaultTransforms = ["translate(0px,0px)","scale(1)","rotate(0deg)"]
  #pseudoMoves = []
  #pseudoLegalMoves = []
  #legalMoves = [] 
  constructor(color,name,square,type,x,y){
    this.#setColor(color)
    this.#setName(name)
    this.setSquare(square)
    this.#setType(type)
    this.setX(x)
    this.setY(y)   
  }
  static getData(name){
   if(!name) return
   let nameArr = Array.from(name)
   let index_ = nameArr.indexOf("_")
   let type = name.slice(0,index_)
   let color = nameArr[nameArr.length - 1] == "w" ? "white" : "black"
   return {type,color}
  }
  cutDirection(moves){
    let newMoves = []
    for(let i = 0; i < moves.length; i++){     
      let square = game.getBoard().getSquare(moves[i])
      let hasPiece = square.hasPiece()      
      let hasEnemyPiece = square.hasEnemyPiece(this.getColor())
      let adder = hasPiece && hasEnemyPiece ? 1 : hasPiece && !hasEnemyPiece ? 0 : null
      if(hasPiece){
        newMoves = moves.slice(0,i+adder)
        break
      }
      newMoves.push(moves[i])
    }  
    return newMoves  
  }
  #highlightstartsquare(){
    let color = "rgb(74, 236, 0)"
    let square = this.getSquare()
    square.applyColor(color)
  }
  #setColor(color){
    this.#color = color
  }
  getColor(){
    return this.#color
  }
  #setName(name){
   this.#name = name
  }
  getName(){
    return this.#name
  }
  #setType(type){
    this.#type = type
  }
  getType(){
    return this.#type
  }
  setSquare(square){
    this.#square = square
  }
  getSquare(){
    return this.#square
  }
  setX(x){
    this.#x = x
  }
  getX(){
    return this.#x
  }
  setY(y){
    this.#y = y
  }
  getY(){
    return this.#y
  }
  getpseudoMoves(){
    return this.#pseudoMoves
  }
  getpseudoLegalMoves(){
    return this.#pseudoLegalMoves
  }
  getLegalMoves(){
    return this.#legalMoves
  }
}

class Rook extends Piece{
  #moved = false
  constructor(color,name,square,type,x,y){
    super(color,name,square,type,x,y)
  }
  setMoved(status){
    this.#moved = status
  }
  getMoved(){
    return this.#moved
  }
  concatMoves(){
    return [this.createUpMoves(),this.createDownMoves(),this.createLeftMoves(),this.createRightMoves()]
  }
  createMoves(){  
    return this.concatMoves().map(moves => this.cutDirection(moves)).flat()
  }
  createUpMoves(){
    let moves = []
    for(let i = this.getY() + 1; i <= 8; i++){  
      moves.push(Square.encode(this.getX(),i))
    }
    return moves
  }
  createDownMoves(){
    let moves = []
    for(let i = this.getY() - 1; i >= 1; i--){
      moves.push(Square.encode(this.getX(),i))
    }
    return moves
  }
  createLeftMoves(){
    let moves = []
    for(let i = this.getX() - 1; i >= 1; i--){    
      moves.push(Square.encode(i,this.getY()))
    }
    return moves
  }
  createRightMoves(){
    let moves = []
    for(let i = this.getX() + 1; i <= 8; i++){    
      moves.push(Square.encode(i,this.getY()))
    }
    return moves
  }
}

class Knight extends Piece{
  constructor(color,name,square,type,x,y){
    super(color,name,square,type,x,y)
  }
  concatMoves(){
    return [this.createAllMoves()]
  }
  cutDirection(moves){
    let newmoves = []
    moves.forEach(move =>{
      let square = board.getSquare(move)
      let hasPiece = square.hasPiece()      
      let hasEnemyPiece = square.hasEnemyPiece(this.getColor())
      if(!hasPiece || hasEnemyPiece) newmoves.push(move)
    })  
    return newmoves 
  }
  createAllMoves(){
    let coords = [[1,2],[-1,2],[-2,1],[-2,-1],[1,-2],[-1,-2],[2,1],[2,-1]]
    let moves = []
    coords.forEach(coord =>{
      let [x,y] = [this.getX() + coord[0],this.getY() + coord[1]]
      if(!Square.exists(x,y)) return 
      moves.push(Square.encode(x,y))
    })
    return moves
  }
  createMoves(){  
    return this.cutDirection(this.concatMoves().flat())
  }
}

class Bishop extends Piece{
  constructor(color,name,square,type,x,y){
    super(color,name,square,type,x,y)
  }      
  concatMoves(){
    return [this.createRightUpMoves(),this.createLeftUpMoves(),this.createRightDownMoves(),this.createLeftDownMoves()]
  }
  createMoves(){ 
    return this.concatMoves().map(moves => this.cutDirection(moves)).flat()
  }
  createRightUpMoves(){
    let moves = []
    for(let i = this.getX() + 1,y = this.getY() + 1; i <= 8 && y <= 8; i++,y++){  
      moves.push(Square.encode(i,y))
    }
    return moves
  }
  createLeftUpMoves(){
    let moves = []
    for(let i = this.getX() - 1,y = this.getY() + 1; i >= 1 && y <= 8; i--,y++){  
      moves.push(Square.encode(i,y))
    }
    return moves
  }
  createRightDownMoves(){
    let moves = []
    for(let i = this.getX() + 1,y = this.getY() - 1; i <= 8 && y >= 1; i++,y--){  
      moves.push(Square.encode(i,y))
    }
    return moves
  }
  createLeftDownMoves(){
    let moves = []
    for(let i = this.getX() - 1,y = this.getY() - 1; i >= 1 && y >= 1; i--,y--){  
      moves.push(Square.encode(i,y))
    }
    return moves
  }
}

class Queen extends Piece{
  constructor(color,name,square,type,x,y){
    super(color,name,square,type,x,y)
  }
  concatMoves(){
    let bishopmoves = new Bishop(this.getColor(),this.getName(),this.getSquare(),this.getType(),this.getX(),this.getY()).concatMoves()
    let rookmoves = new Rook(this.getColor(),this.getName(),this.getSquare(),this.getType(),this.getX(),this.getY()).concatMoves()
    return [Object.values(bishopmoves),Object.values(rookmoves)].flat()
  }
  createMoves(){
    return this.concatMoves().map(moves => this.cutDirection(moves)).flat()
  }
}

class King extends Piece{
  #isInCheck = false
  #moved = false
  constructor(color,name,square,type,x,y){
    super(color,name,square,type,x,y)

  }
  setMoved(status){
    this.#moved = status
  }
  getMoved(){
    return this.#moved
  }
  setisInCheck(state){
    this.#isInCheck = state
  }
  getisInCheck(){
    return this.#isInCheck
  }
  concatMoves(){
    return [this.createAllMoves()]
  }
  TranferRook(){}
  Castle(){}
  isInCheck(){}
  createAllMoves(){
    let coords = [[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],[1,0]]
    let moves = []
    coords.forEach(coord =>{
      let [x,y] = [this.getX() + coord[0],this.getY() + coord[1]]
      if(!Square.exists(x,y)) return 
      moves.push(Square.encode(x,y))
    })
    return moves
  }
  cutDirection(moves){
    let newmoves = []
    moves.forEach(move =>{
      let square = board.getSquare(move)
      let hasPiece = square.hasPiece()      
      let hasEnemyPiece = square.hasEnemyPiece(this.getColor())
      if(!hasPiece || hasEnemyPiece) newmoves.push(move)
    })  
    return newmoves
  }
  createMoves(){  
    return this.cutDirection(this.concatMoves().flat())
  }
}

class Pawn extends Piece{
  #moved2
  #promotionCompleted = false
  constructor(color,name,square,type,x,y){
    super(color,name,square,type,x,y)
    this.#moved2 = false
  }
  setpromotionCompleted(status){
    this.#promotionCompleted = status
  }
  getpromotionCompleted(){
    return this.#promotionCompleted
  }
  getmoved2(){
    return this.#moved2
  }
  Moved2(startY,endY){
    this.#moved2 = startY - endY == 2 || endY - startY == 2 ? true : false
  }
  isPromotion(color,y){
    let promoteY = color == "white" ? 8 : 1
    let promoteColor = promoteY == 8 ? "white" : promoteY == 1 ? "black" : false
    return y == promoteY && this.getColor() == promoteColor
  }
  isEnPassant(){}
  Promote(type){}
  OpenPromotion(y,target,Oldcaptures){
    if(!this.isPromotion(this.getColor(),y)) return
    let promotion = this.getPieceElement("promotion")
    promotion.style.display = "flex"
  }
  concatDiagonalMoves(){
    return [this.diagonalMove(1).concat(this.diagonalMove(-1))]
  }
  concatMoves(){
    return [this.moveForward()].concat(this.concatDiagonalMoves())
  }
  createMoves(){
    return this.concatMoves().map((moves,i) => i == 0 ? this.cutDirection(moves) : this.cutDiagonal(moves)).flat()
  }
  getDirection(color){
    return color === "white" ? 1 : -1
  }
  cutDiagonal(moves){
    let newmoves = []
    moves.forEach(move =>{
      let square = board.getSquare(move)
      if(square){
        let hasEnemy = square.hasEnemyPiece(this.getColor()) 
        hasEnemy ? newmoves.push(move) : null
      }    
    })
    return newmoves
  }
  cutDirection(moves){
    let newMoves = []
    for(let i = 0; i < moves.length; i++){     
      let square = board.getSquare(moves[i])
      let hasPiece = square.hasPiece()      
      if(hasPiece){
        newMoves = moves.slice(0,i)
        break
      } 
      newMoves.push(moves[i])
    }
    return newMoves
  }
  diagonalMove(direction2){
    let moves = []
    let direction = this.getDirection(this.getColor())
    let condition1 = direction2 == 1 ? this.getX() <= 7 : this.getX() >= 2
    let condition2 = this.getColor() == "white" ? this.getY() == 8 : this.getY() == 1  
    if(!condition1 || condition2) return moves
    moves.push(Square.encode(this.getX() + direction2,this.getY() + direction))
    return moves    
  }
  moveForward(){
    let moves = []
    let pieceColor = this.getColor()
    const direction = this.getDirection(pieceColor)
    const startRow = pieceColor === "white" ? 2 : 7
    const maxSteps = this.getY() === startRow ? 2 : 1
    let condition = pieceColor == "white" ? this.getY() >= 1 && this.getY() <= 7 : this.getY() >= 2 && this.getY() <= 8
    if(!condition) return moves
    for (let step = 1; step <= maxSteps; step++) {
      const newY = this.getY() + step * direction
      moves.push(Square.encode(this.getX(),newY))
    }
    return moves
  }
}

class Engine extends Player{

  constructor(){
    
  }
  init(){}
  getBestMove(){}
  async Move(){}

}

const details = new Details()
const player1 = new Player("Black","black","user")
const player2 = new Player("White","white","user")
let time = 600
let white = new Timer(time,"white")
let black = new Timer(time,"black")
let squares = Board.createSquares()
let pieces = Board.createPieces(squares)
const board = new Board(pieces,squares)
const game = new Game(board,{player1,player2},{white,black},details)
console.log("Chess version 5!");