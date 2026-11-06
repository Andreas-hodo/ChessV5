class Game{
  #board;
  #players;
  #timers;
  #resignation = false
  #isSoundAllowed = false
  #Started = false
  constructor(board,players,timers){
    this.#board = board;
    this.#players = players;
    this.#timers = timers;
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
  updateResignation(){
   this.#resignation = this.getPlayer("white").getresigned() || this.getPlayer("black").getresigned()
  }
  Resignation(){
    return this.#resignation
  }
  getPlayer(color){
    let id = color == "white" ? "player2" : color == "black" ? "player1" : null
    return this.getPlayers()[id]
  }
  getTimer(color){
    return this.getTimers()[color]
  }
  playAgain(){
    location.reload()
  }
  hasEnded(){
    let boardEnded = this.getBoard().getis_Draw() || this.getBoard().getis_Checkmate()
    let timerEnded = this.getTimer("white").Ended() || this.getTimer("black").Ended()
    let resignation = this.Resignation()
    let DrawAccepted = this.getPlayer("white").getDrawAccepted() || this.getPlayer("black").getDrawAccepted()
    return boardEnded || timerEnded || resignation || DrawAccepted
  }
  changesoundElement(){
    let volume = document.getElementById("volume")
    let tag = this.SoundAllowed() ? "up" : "off"
    let othertag = tag == "up" ? "off" : "up"
    volume.classList.replace(`fa-volume-${othertag}`,`fa-volume-${tag}`)
  }
  changeSoundAllowed(){
    this.#isSoundAllowed = this.#isSoundAllowed ? false : true
    this.changesoundElement()     
  }
  SoundAllowed(){
    return this.#isSoundAllowed
  }
  setStarted(val){
    this.#Started = val
  }
  Started(){
    return this.#Started
  }
  Start(){
    if(this.Started()) return 
    Board.setCalcColor()
    let timer = this.getTimer("white");
    Timer.handleState()
    timer.start()
    Arrows.init()
    this.setStarted(true)
    let mainPath = ".main .buttonscont "
    let main = document.querySelector(mainPath)   
    let startbtns = document.querySelectorAll(mainPath + ".startGame")
    startbtns.forEach(btn => main.removeChild(btn))
  }
  download(){
    let board = game.getBoard()
    let currentTime  = new Date()
    let [player1,player2] = [this.getPlayer("white"),this.getPlayer("black")]
    let date = [currentTime.getDate(),currentTime.getMonth()+1,currentTime.getFullYear(),currentTime.getHours(),currentTime.getMinutes()].map(num => num.toString().padStart(2, '0')).join(".")
    let filename = `Chess-${player1.getName()}vs${player2.getName()}-${date}`
    let timer = [this.getTimer("white"),this.getTimer("black")].map(timer => timer.getFormattedTime()).join("-");
    let counter = 1
    let resignation = this.Resignation()
    let allMoves = this.getBoard().getMoves().reduce((str,curr,index) => {return str += index % 2 == 0 ? ` ${counter++}.${curr} ` : curr},"")
    let content = {draw:this.getBoard().getis_Draw(),checkmate: this.getBoard().getis_Checkmate() ,check:this.getBoard().getisCheck(),fen:board.getstrFen(),date,resignation,moves: allMoves,Players: `${player1.getName()}-${player2.getName()}`,Time:timer}
    let text = Object.entries(content).map(([key, value]) => `${key}: ${value}`).join("\n");
    let blob = new Blob([text],{type:'text/plain'});
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.txt`;
    link.click();
  }
  DisplayMessage(message){
    const invalidpopup = document.querySelector("#invalid_popup")
    invalidpopup.style.animation = 'none';
    setTimeout(function() {
      invalidpopup.style.animation = 'invalidpopup 5s ease-in-out forwards';
      invalidpopup.innerText = message
    }, 100);
  }
  End(winner,reason){
    if(!this.hasEnded()) return
    let board = this.getBoard()
    // let endButtons = document.querySelectorAll("#columns1 i") //Να βγαλω τα onclick 
    // endButtons.forEach(btn => {
    //   btn.style.opacity = "0.7"
    //   btn.onclick = () =>{}
    // })
    let colors = ["white","black"]
    colors.forEach(color =>{
      let currTimer = this.getTimer(color)
      if(!currTimer.Ended()) currTimer.End(currTimer.remainingTime())
    })    
    board.disablePieces()
    board.getSquares().forEach(square => square.removeClick())
    this.showResult(winner,reason)
  }
  showResult(winner,reason){
    let msg = document.getElementById("winner")
    let finalres = document.getElementById("finalresult")
    msg.innerText = winner
    finalres.innerText = reason
    let respopup = document.getElementById("resultpopup")
    respopup.style.display = "flex"
    let finishSound = new Audio("https://andreas-hodo.github.io/Chess/Game/sounds/level-win-6416.mp3")
    if(this.SoundAllowed()) finishSound.play()
  }
}

class Board{
  #pieces;
  #squares;
  #arrows = []
  #counter = 3;
  static cordinates_x = [0,'a','b','c','d','e','f','g','h']
  static cordinates_y = [0,1,2,3,4,5,6,7,8]
  static promotionData;
  #fen = [0, 'rnbqkbnr', 'pppppppp', '8', '8', '8', '8', 'PPPPPPPP', 'RNBQKBNR', 'w', 'KQkq', '-', '0', '1']
  #stringFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  #positions = ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -"]
  #movesNotation = []
  clickedPiece = null
  draggingpiece = null
  #last_move = []
  #all_moves = []
  #captures = 0
  #full_moves = 1
  #half_moves = 0
  #has_legal = true
  #isCheck = false
  #is_Checkmate = false
  #is_Draw = false
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
  updatecaptures(){
    this.#captures++
  }
  getcaptures(){
    return this.#captures
  }
  updatefull_moves(){
    this.#full_moves++
  }
  getfull_moves(){
    return this.#full_moves
  }
  updatehalf_moves(moves){
    this.#half_moves = moves
  }
  gethalf_moves(){
    return this.#half_moves
  }
  sethas_legal(val){
    this.#has_legal = val
  }
  gethas_legal(){
    return this.#has_legal
  }    
  setisCheck(val){
    this.#isCheck = val
  }
  getisCheck(){
    return this.#isCheck
  }
  setis_Checkmate(val){
    this.#is_Checkmate = val
  }
  getis_Checkmate(){
    return this.#is_Checkmate
  }
  setis_Draw(val){
    this.#is_Draw = val
  }
  getis_Draw(){
    return this.#is_Draw
  } 
  setFenRow(index,rowData){
   this.#fen[index] = rowData
  }
  updatelast_move(move){
    this.#last_move = move
  }
  getlast_move(){
    return [...this.#last_move]
  }
  updateallMoves(move){
    this.#all_moves.push(move)
  }
  getallMoves(){
    return [...this.#all_moves]
  }
  addMove(move){
    this.#movesNotation.push(move)
  }
  getMoves(){
    return [...this.#movesNotation]
  }
  #removelastMove(){
    this.#movesNotation.pop()
  }
  addPosition(position){
    this.#positions.push(position)
  }
  getPositions(){
    return [...this.#positions]
  }
  updateturn(){
    this.#turn = this.#turn == "white" ? "black" : "white"
  }
  getTurnTeam(){
    return this.#turn
  }
  getOppositeTeam(color){
    return color == "white" ? "black" : "white"
  }
  applySquaresColor(moves,color){
    let colors = [["green","rgb(30, 94, 0)"],["yellow","rgb(255, 241, 0)"]]
    moves.forEach(move =>{
      let square = this.getSquare(move)
      let [sqcolor,colorRGB] = square.hasEnemyPiece(color) ? colors[1] : colors[0]
      square.applyColor(sqcolor,colorRGB)    
    })
  }
  Evaluation(){
    let piecesValues = {rook: 5,knight: 3,bishop: 3,queen: 9,pawn: 1}
    let Blackvalue = 0
    let Whitevalue = 0
    this.getPieces().forEach(piece =>{
      if(piece.getType() != "king"){
        switch(piece.getColor()){
          case "white":           
            Whitevalue += piecesValues[piece.getType()]
            break
          case "black":
            Blackvalue += piecesValues[piece.getType()]
            break
        }
      }
    })
    let materialnum = Whitevalue - Blackvalue
    let winingMaterial = Math.abs(materialnum) 
    let material = `+${winingMaterial}`
    let materialCase = materialnum > 0 ? 1 : materialnum < 0 ? 2 : materialnum == 0 ? 3 : null     
    let pointswhite = document.getElementById(`whitematerial`)      
    let pointsblack = document.getElementById(`blackmaterial`)
    let {player1,player2} = game.getPlayers()
    switch(materialCase){
      case 1:
        pointswhite.innerText = material
        pointsblack.innerText = null
        player2.setMaterialPoints(material)
        player1.setMaterialPoints(0)
        break
      case 2:
        pointsblack.innerText = material
        pointswhite.innerText = null
        player1.setMaterialPoints(material)
        player2.setMaterialPoints(0)
        break
      case 3:
        pointswhite.innerText = null
        pointsblack.innerText = null
        player1.setMaterialPoints(0)
        player2.setMaterialPoints(0)
        break
    }
  }
  getPieceNames(){
    let pieces = this.getPieces().map(piece => piece.getName())
    return pieces
  }
  addPiece(piece){
    if(piece instanceof Piece){
      let pieceSquare = this.getSquare(piece.getSquare())
      if(!pieceSquare) return
      if(pieceSquare.getpieceName() != null) return 
      pieceSquare.setpieceName(piece.getName())
      this.#pieces.push(piece)
      piece.setpieceElem()
      Board.makePieceDraggable(piece)
      this.#updateCounter()
    }
  }
  removePiece(piecename){
    let allPieces = this.getPieceNames()
    let piece = this.getPiece(piecename)
    if(piece != null){
      let pieceSquare = this.getSquare(piece.getSquare())
      let pieceindex = allPieces.includes(piecename) ? allPieces.indexOf(piecename) : null
      if(pieceindex >= 0){
        let removedPiece = this.#pieces.splice(pieceindex,1).pop()
        Board.removeDragging(removedPiece)
        removedPiece.removeElement()
        pieceSquare.setpieceName(null)
        let opponentTeam = this.getOppositeTeam(removedPiece.getColor())
        game.getPlayer(opponentTeam).updateCaptured(removedPiece)
        this.updatecaptures()
      }
    }
  }
  getPieces(){
    return [...this.#pieces];
  }
  getSquares(){
    return [...this.#squares];
  }
  static makePieceDraggable(piece){
    if(piece instanceof Piece){
      piece.setpieceElem()
      piece.initEvent()
      piece.initDrag()
      piece.initDrop()
      piece.initEnter()
      piece.initLeave()
      piece.initCancel()
      piece.disableLeftClick()
      piece.Click()
    }
  }
  static removeDragging(piece = null){
    if(piece instanceof Piece){
      piece.removeDrag()
      piece.removeDrop()
      piece.removeEnter()
      piece.removeLeave()
      piece.removeCancel()
      piece.removeClick()
    }
    //this.#pieceElement.style.transform = this.#allTransforms.join(" ").toString()
  }
  disablePieces(color = null){
    this.getPieces().forEach(piece => {
      if(!color || (color && piece.getColor() == color)) Board.removeDragging(piece)      
    })
  }
  getPiece(name){
    return this.getPieces().filter(piece => {if(piece.getName() == name) return piece}).pop();
  }
  getSquare(name){
    return this.getSquares().filter(square => {if(square.getName() == name) return square}).pop();
  }
  getArrows(){
    return [...this.#arrows];
  }
  removeArrow(index){
    if(index >= 0) this.#arrows.splice(index,1)
  }
  updateArrows(arrow){
    this.#arrows.push(arrow)
  }
  #updateCounter(){
    this.#counter++;
  }
  getCounter(){
    return this.#counter;
  }
  copyFen(){
   navigator.clipboard.writeText(this.getstrFen())
  }
  highlightLastMove(){
    this.getlast_move().forEach(square =>{
      let squareobj = this.getSquare(square)
      squareobj.applyColor("mustard","rgb(227,224,150)")
    })  
  }
  removeSquaresColor(){
   this.getSquares().forEach(square =>{
      square.removeColor()
   })
  }
  removehighlight(){
    this.getlast_move().forEach(square =>{
      let squareobj = this.getSquare(square)
      squareobj.removeColor()
    }) 
  }
  highlightKing(kingColor){
    let king = this.getPiece(`king_${kingColor[0]}`)
    if(king.isInCheck()){
      king.setisInCheck(true)
      this.setisCheck(true)
      let kingSquare = this.getSquare(king.getSquare())
      kingSquare.applyColor("red","rgb(255,0,0)")
    }
  }
  isSquareControlled(color,square){
    let pieces = ["rook","knight","bishop","queen","king","pawn"]
    let opponentColor = this.getOppositeTeam(color) 
    let isControlled = false   
    pieces.forEach(piecename =>{ 
      let {x,y} = square.decode(square.getName()) 
      let piece = Board.CreatePiece(color,piecename,square,piecename,x,y)
      let isPawn = piecename == "pawn" ? true : false
      let cuttedmoves = []
      let piecemoves = isPawn ? piece.concatDiagonalMoves() : piece.concatMoves()
      if(isPawn){cuttedmoves = piecemoves}
      piecemoves.forEach(directionmoves =>{
        if(!isPawn){cuttedmoves.push(piece.cutDirection(directionmoves))}        
      })
      for(let i = 0; i < cuttedmoves.length; i++){
        for(let j = 0; j < cuttedmoves[i].length; j++){
          let squareId = cuttedmoves[i][j]
          let square = this.getSquare(squareId)
          let squarePiece = square.getpieceName()
          if(!squarePiece) continue                 
          let hasPiece = square.hasSpecificPiece(piecename,opponentColor)      
          if(!hasPiece) continue  
          isControlled = true           
        }           
      }      
    })
    return isControlled
  }
  setPiecePosition(piece, targetSquare,piecename = null){
    let startSquare = this.getSquare(piece.getSquare())
    piece.updateDetails(targetSquare)
    targetSquare.setpieceName(piece.getName())
    startSquare.setpieceName(piecename)
  }
  movePieceTo(piece, targetSquare){
    this.MovePieceElem(piece, targetSquare)
    this.setPiecePosition(piece, targetSquare)
  }
  MovePieceElem(piece,targetSquare){
    let pieceElem = document.getElementById(piece.getName())
    let squareElem = document.getElementById(targetSquare.getName())
    squareElem.appendChild(pieceElem)
  }
  MovePiece(piece,targetSquare,additionalMoves = []){
    if(!piece || !targetSquare) return
    if(game.hasEnded()) return
    let startSquare = this.getSquare(piece.getSquare())
    this.clickedPiece = null
    let moves = piece.createMoves().concat(additionalMoves)
    this.removeSquaresColor()
    this.highlightLastMove()
    let turnColor = this.getTurnTeam() 
    let oppositeTeam = this.getOppositeTeam(turnColor)  
    //Check if the moving piece can move by turn   
    if(turnColor != piece.getColor()) return
    //Dont allow the move in the start square 
    if(piece.getSquare() == targetSquare.getName()) return
    //Dont allow the move if is not legal  
    if(!moves.includes(targetSquare.getName())){
      game.DisplayMessage(`Invalid move ${piece.getSquare()}-${targetSquare.getName()}!`)
      return
    }
    //Dont allow the capture in a square with same piece color
    if(targetSquare.hasPiece() && !targetSquare.hasEnemyPiece(piece.getColor())) return    
    if(piece.getType() == "pawn"){
      if(piece.isPromotion(turnColor,piece.getY())){
        piece.OpenPromotion(targetSquare.getName()) 
        return 
      }      
    }
    if(piece.getType() == "pawn"){
      let enpassant = piece.isEnPassant(turnColor,piece.getY())
      if(enpassant.isEnPassant && enpassant.square == targetSquare.getName()){
        let piecename = this.getSquare(enpassant.targetSquare).getpieceName()
        piece.EnPassant(piecename) 
      }
    }
    if(game.SoundAllowed()){
      let movePieceSound = new Audio("https://andreas-hodo.github.io/Chess/Game/sounds/479457-Moving_Random_Chess_Pieces_08.WAV")
      movePieceSound.play()
    }
    if(piece.getType() == "king" || piece.getType() == "rook"){
      piece.setMoved(true)
    }
    if(piece.getType() == "pawn"){
     piece.Moved2(startSquare.gety(),targetSquare.gety())  
    } 
    let isOccupied = targetSquare.hasPiece()
    if(isOccupied){
      let piece = targetSquare.getpieceName()
      this.removePiece(piece)
    }
    this.movePieceTo(piece,targetSquare)
    this.removehighlight()
    this.updatelast_move([startSquare.getName(),targetSquare.getName()])
    this.updateallMoves(`${startSquare.getName()}-${targetSquare.getName()}`)
    this.highlightLastMove()
    this.updateturn()
    Timer.Flip(oppositeTeam)
    this.Evaluation()    
    let Enemyking = this.getPiece(`king_${turnColor[0]}`)
    if(Enemyking.isInCheck()){
      Enemyking.setisInCheck(false)
    }
    this.highlightKing(oppositeTeam)
    //this.Draw(fen)    
    this.CheckMate()
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
      let [x,y] = [Board.cordinates_x,Board.cordinates_y]
      let squareId = x[i] + y[z]
      let pieceId = piecesSquares.includes(squareId) ? pieces[piecesSquares.indexOf(squareId)] : null
      let defColor = (i % 2 == 1 && z % 2 == 0) || (i % 2 == 0 && z % 2 == 1) ? "white" : "black"
      let currentSquare = new Square(squareId,defColor,defColor,i,z)
      currentSquare.disableLeftClick()
      currentSquare.Click()    
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
      let piece = Board.CreatePiece(piecedata.color,piecename,square.getName(),piecedata.type,x,y)
      pieces.push(piece)  
      Board.makePieceDraggable(piece)  
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
  Repetition(currpos){
  let positions = this.getPositions()
  let repetitionlength = positions.filter(pos => pos === currpos).length
  return repetitionlength >= 3
 }
 InsufficientMaterial(){
  let details = {white:[],black:[]}
  let [knights,bishops] = [0,0]
  let otherPieces = ["pawn","rook","queen"]
  let prevbishopColor = null
  let prevbishopSqColor = null
  for(let i = 0; i < this.getPieces().length; i++){
    let currentPiece = this.getPieces()[i]
    let type = currentPiece.getType()
    if(otherPieces.includes(type) || (knights > 1 || bishops > 2)) return false           
    let color = currentPiece.getColor() 
    let sqcolor = this.getSquare(currentPiece.getSquare())?.getColor()
    if(type == "bishop" && prevbishopColor == color) return false
    if(type == "bishop" && sqcolor == prevbishopSqColor) return true
    if(type == "bishop"){bishops++;prevbishopColor = color;prevbishopSqColor = sqcolor}     
    if(type == "knight") knights++  
    details[color].push(currentPiece)
  }
  let piecesNum = Object.values(details).flat().length
  if(piecesNum <= 3) return true
  return false
 }
 CheckMate(){
  if(this.hasLegal()) return 
  let color = this.getTurnTeam()
  let currentKing = this.getPiece(`king_${color[0]}`)
  if(currentKing.getisInCheck()){
    this.setis_Checkmate(true)
    let winner = color == "white" ? "Black" : "White"
    game.End(`${winner} WON!`,"by Checkmate!")
  }
 }
 Draw(currpos){
  let color = this.getTurnTeam()
  let currentKing = this.getPiece(`king_${color[0]}`)
  if(!currentKing.getisInCheck() && !this.hasLegal()){
    this.setis_Draw(true)
    game.End("Draw!","No legal moves!")
  }
  if(this.gethalf_moves() == 100){
    this.setis_Draw(true)
    game.End("Draw!","50-Move Rule!")
  }
  if(this.InsufficientMaterial()){
    this.setis_Draw(true)
    game.End("Draw!","Insufficient Material!")
  }
  if(this.Repetition(currpos)){
    this.setis_Draw(true)
    game.End("Draw!","Three-Fold Repetition!")
  }
 }
 hasLegal(){
  let turn = this.getTurnTeam()
  let legal = false
  for(let i = 0; i < this.getPieces().length; i++){
    let piece = this.getPieces()[i]
    if(piece.getColor() == turn){
      let movesLength = piece.createMoves().length
      if(movesLength >= 1){
        legal = true;
        break
      }    
    } 
  }
  this.sethas_legal(legal)
  return this.gethas_legal()
 }
  static setCalcColor() {
    const boardElement = document.getElementById("chess_board");
    let board = game.getBoard()
    boardElement.addEventListener("contextmenu", e => {
      const target = e.target.closest(".square");
      if (!target) return;
      let square = board.getSquare(target.id)
      if(!square) return
      let colors = {black: ["rgb(209,0,0)","darkred","black"],white:["rgb(255,0,0)","lightred","white"]}
      let defaultcolor = colors[square.getDefaultColor()][2]
      let colorRGB = colors[square.getDefaultColor()][0]
      let redColor = colors[square.getDefaultColor()][1]
      let isDefault = square.getColor() == defaultcolor
      let isHighlight = board.getlast_move().includes(square.getName())
      let redColored = square.getColor() == redColor
      let [newColor,newRGB] = redColored && isHighlight ? ["mustard","rgb(227,224,150)"] : isHighlight || isDefault ? [redColor,colorRGB] : []
      newColor ? square.applyColor(newColor,newRGB) : square.removeColor()
      board.highlightKing(board.getTurnTeam())
    })
  }
  #updateFlipped(){
   this.#flipped = !this.#flipped
  }
  Flipped(){
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
}

class Player{
  #name;
  #team;  
  #role = "user"
  #captured = [];
  #resigned = false;
  #DrawOffered = false;
  #DrawAccepted = false; 
  #materialPoints = 0
  constructor(name,team,role){
    this.#setName(name)
    this.#setTeam(team)
    this.#setRole(role)
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
  updateCaptured(piece){
    this.#captured.push(piece)
  }
  getCaptured(){
    return [...this.#captured]
  }
  #loadName(){
    if(!this.getTeam() || !this.getName()) return
    let nameElem = document.getElementById(`${this.getTeam()}_player`)
    nameElem.innerHTML = `${this.getName()}<span id="${this.getTeam()}material" class="material"></span>`
  }
  setresigned(val){
    this.#resigned = val
    game.updateResignation()
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
  setMaterialPoints(value){
    this.#materialPoints = value
  }
  getMaterialPoints(){
    return this.#materialPoints
  }
  static resign(){
    let board = game.getBoard()
    let turn = board.getTurnTeam()
    let {player1,player2} = game.getPlayers()
    let players = {white:player2,black:player1}
    let opponentTeam = board.getOppositeTeam(turn)
    let currplRole = players[turn]?.getRole()
    let currplayer = (currplRole == "bot" || currplRole == "enemyuser") ? players[opponentTeam] : players[turn]
    if(currplayer.getresigned()) return
    currplayer.setresigned(true)
    let winner = currplayer.getTeam() == "white" ? "Black" : "White"
    let curr = currplayer.getTeam() == "white" ? "White" : "Black"
    game.End(`${winner} Won!`,`${curr} resigned!`)
  }
  OfferDraw(){
    if(this.getDrawOffered()) return
    let btn = document.getElementById(`draw_${this.getTeam()}`)
    let enemyColor = this.getTeam() == "white" ? "black" : "white"
    let enemyplayer = game.getPlayer(enemyColor)
    let enemybtn = document.getElementById(`draw_${enemyColor}`)
    btn.style.opacity = 0.7
    enemybtn.title = "Claim Draw"
    enemybtn.addEventListener("click",enemyplayer.#AcceptDraw())
    btn.addEventListener("click",() =>{})
    this.setDrawOffered(true)
  }
  #AcceptDraw(){
    if(this.getDrawOffered() || this.getDrawAccepted()) return
    this.setDrawAccepted(true)
    game.End("DRAW!","Mutual agreement!")
  }
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
  #started = false      
  #counter;
  static handlevisibility;
  offline;
  online;
  Ended(){
    return this.#ended
  }
  static focus(color){
    document.querySelectorAll(".timer").forEach(timer =>{ 
      timer.style.opacity = timer.classList.contains(color) ? "1" : "0.7"
    })
  }
  getFormattedTime(){    
    let [minutes,seconds] = [String(parseInt(this.#time / 60)).padStart(2,"0"),String(this.#time % 60).padStart(2,"0")]
    return `${minutes}:${seconds}`
  }
  #setTime(){
    let timer = document.getElementById(`timer_${this.#team}`)
    timer.innerText = this.getFormattedTime()
    return timer
  }
  #loadTime(){
    this.#setTime()
  }
  #update(){
    if(game.hasEnded()) return
    this.#time--   
    this.End()  
    let timer = this.#setTime()    
    let beepSound = new Audio("https://andreas-hodo.github.io/Chess/Game/sounds/point-smooth-beep-230573.mp3")
    let opponentColor = this.#team == "white" ? "black" : "white"
    let low = this.#time <= 9
    timer.style.color = low && this.#time % 2 == 1 ? "red" : opponentColor
    if(game.SoundAllowed() && low) beepSound.play()
  }
  static Flip(color){
    let opponentColor = game.getBoard().getOppositeTeam(color)
    game.getTimer(color).start()
    game.getTimer(opponentColor).stop()
  }
  static balance(timer){
      if(game.hasEnded()) return
      let offtime = parseInt(timer.online / 1000 - timer.offline / 1000) - 1
      let availTime = timer.#time - offtime > 0
      timer.#time = availTime ? timer.#time -= offtime : 1     
      timer.start()
  }
  static handleState(){
    Timer.handlevisibility = () =>{
      let state = document.visibilityState === "hidden"
      let board = game.getBoard()
      let timer = game.getTimer(board.getTurnTeam())
      state ? Timer.Offline(timer) : Timer.Online(timer)
    } 
    let body = document
    body.addEventListener("visibilitychange",Timer.handlevisibility)   
  }
  start(){
    if(this.#started) return 
    if(!this.#ended && !game.hasEnded()){
      this.#counter = setInterval(() =>{this.#update()},1000);
      Timer.focus(this.#team)
      this.#started = true
    }
  }
  stop(){
    if(!this.#started) return 
    if(!this.#ended && !game.hasEnded()){
      clearInterval(this.#counter)
      this.#started = false
    }
  }
  remainingTime(){return this.#time}
  End(time = 0){
    if(this.#time > 0 && this.#time > time) return 
    this.stop()
    this.#ended = true
    let body = document
    body.removeEventListener("visibilitychange",Timer.handlevisibility)
    let winner = this.#team == "white" ? "Black" : "White"
    if(this.#time == 0) game.End(`${winner} WON!`,`Time ended!`)
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

class Arrows{
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
        let arrowIndex = game.getBoard().getArrows().indexOf(squares.replace(" ",""))
        if(arrowIndex == -1){
          Arrows.drawMoves(concatedsquares,code);
          Arrows.update(squares.replace(" ",""))
        }else{
          Arrows.remove(arrowIndex,squares)
        }        
      }
    })
  }
  static clear(){document.getElementById("arrows").innerHTML = ""}
  static update(arrowId){
    game.getBoard().updateArrows(arrowId)
  }
  static remove(index,squares){
    let arrcont = document.getElementById("arrows")
    let arrow = document.getElementById(squares.replace(" ",""))
    if(arrcont && arrow) arrcont.removeChild(arrow)
    game.getBoard().removeArrow(index)
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
    return Board.cordinates_x[x] + Board.cordinates_y[y]
  }
  decode(){
    let x = this.getx()
    let y = this.gety()
    return {x,y}
  }
  #handleClick(){
    let board = game.getBoard()
    if(board.clickedPiece){
      let pieceelem = board.clickedPiece
      let piece = board.getPiece(pieceelem.id)
      let sqwidth = this.getBoundingClientRect().width
      let startcoords = board.getSquare(pieceelem.parentNode.id).decode()
      let endcoords = board.getSquare(this.id).decode()
      piece.ClickAnimation(sqwidth,[startcoords.x,startcoords.y],[endcoords.x,endcoords.y],pieceelem,piece,this)
      board.clickedPiece = null
    }
  }
  Click(){
    let sqelem = document.getElementById(this.getName())
    sqelem.addEventListener("click",this.#handleClick)
  }
  removeClick(){
    let sqelem = document.getElementById(this.getName())
    sqelem.removeEventListener("click",this.#handleClick)
  }
  applyColor(color,rgb){
    this.#color = color
    let element = document.getElementById(this.getName())
    element.style.backgroundColor = rgb
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
  #imagesrc = null
  #defaultTransforms = ["translate(0px,0px)","scale(1)","rotate(0deg)"]
  #pieceElement = null
  static imagesSrc = {
    white:{pawn:"white-pawn.jpg",rook:"white-rook.jpg",knight:"white-knight.jpg",bishop:"white-bishop.jpg",queen:"white-queen.jpg",king:"white-king.jpg"},
    black:{pawn:"chess-151546_1280.png",rook:"chess-36314_1280.png",knight:"knight-147065_1280.png",bishop:"bishop-147064_1280.png",queen:"queen-147062_1280.png",king:"chess-36308_1280.png"}
  }
  constructor(color,name,square,type,x,y){
    this.#setColor(color)
    this.#setName(name)
    this.setSquare(square)
    this.#setType(type)
    this.setX(x)
    this.setY(y) 
    this.#setimagesrc()  
  }
  disableLeftClick(){
    this.#pieceElement.addEventListener("contextmenu",e =>{e.preventDefault()})
  }
  initEvent(){
   ResEvent.initEvent(this.#pieceElement,"movable","dragging","square",this.#pieceElement,this.#defaultTransforms)
  }
  initDrag(){
   ResEvent.enableEvent(this.#pieceElement,"start")
   this.#pieceElement.addEventListener("ResponsiveDragStart",this.#DragStartEvent)
  }
  initDrop(){
   ResEvent.enableEvent(this.#pieceElement,"drop")
   this.#pieceElement.addEventListener("ResponsiveDrop",this.#DropEvent)
  }
  initEnter(){
   ResEvent.enableEvent(this.#pieceElement,"enter")
   this.#pieceElement.addEventListener("ResponsiveDragEnter",this.#enter)
  }
  initLeave(){
   ResEvent.enableEvent(this.#pieceElement,"leave")
   this.#pieceElement.addEventListener("ResponsiveDragLeave",this.#leave)
  }
  initCancel(){
    ResEvent.enableEvent(this.#pieceElement,"cancel")
    this.#pieceElement.addEventListener("ResponsiveDragCancel",this.#DragCancel)
  }
  removeDrag(){
    ResEvent.disableEvent(this.#pieceElement,"start")
    this.#pieceElement.removeEventListener("ResponsiveDragStart",this.#DragStartEvent)
  }
  removeDrop(){
   ResEvent.disableEvent(this.#pieceElement,"drop")
   this.#pieceElement.removeEventListener("ResponsiveDrop",this.#DropEvent)
  }
  removeEnter(){
   ResEvent.disableEvent(this.#pieceElement,"enter")
   this.#pieceElement.removeEventListener("ResponsiveDragEnter",this.#enter)
  }
  removeLeave(){
   ResEvent.disableEvent(this.#pieceElement,"leave")
   this.#pieceElement.removeEventListener("ResponsiveDragLeave",this.#leave)
  }
  removeCancel(){
    ResEvent.disableEvent(this.#pieceElement,"cancel")
    this.#pieceElement.removeEventListener("ResponsiveDragCancel",this.#DragCancel)
  }
  #DragStartEvent(e){
    e.target.style.cursor = "grabbing"
    e.target.draggable = true
    Arrows.clear()
    let piece = game.getBoard().getPiece(e.target.id)
    piece.drag(piece)
  }
  #DropEvent(e){
    e.detail.drag.style.cursor = "grab"
    e.detail.drop.style.borderColor = "black"
    let board = game.getBoard()
    let piece = board.getPiece(e.detail.drag.id)
    let square = board.getSquare(e.detail.drop.id)
    piece.drop(piece,square)
  }
  #DragCancel(e){
    e.detail.dragElement.parentNode.style.borderColor = "black" 
    e.detail.dragElement.style.cursor = "grab"
    let board = game.getBoard()
    board.removeSquaresColor()
    board.highlightLastMove()
    let opponentsColor = board.getTurnTeam()
    board.highlightKing(opponentsColor)
  }
  #enter(e){
    let curr = e.detail.enterElement
    curr.style.borderColor = "whitesmoke"
  }
  #leave(e){
    let curr = e.detail.leaveElement
    curr.style.borderColor = "black"
  }
  removeClick(){
    this.#pieceElement.removeEventListener("click",this.#handleClick)
  }
  Click(){
    this.#pieceElement.addEventListener("click",this.#handleClick)
  }
  ClickAnimation(squarew, start, end, element, piece, targetsquareelem,additionaMoves = []) {
    let board = game.getBoard()
    let boardFlipped = board.Flipped()
    let targetSquare = board.getSquare(targetsquareelem.id)
    let moves = piece.createMoves().concat(additionaMoves)
    let pieceColor = piece.getColor()
    if(!moves.includes(targetSquare.getName()) || pieceColor != board.getTurnTeam()){
      piece.drop(piece,targetSquare,additionaMoves);
      return
    } 
    let [xs,ys,xe,ye] = [start, end].flat().map(num =>{if(boardFlipped){return 9 - num}else{return num}})
    let xnum = xe > xs ? xe - xs : xs > xe ? xe - xs : 0
    let ynum = ye > ys ? ys - ye : ys > ye ? ys - ye : 0
    let [x,y] = [xnum * squarew,ynum * squarew]
    if(x === 0 && y === 0) return;
    let [stx, sty] = [0, 0];
    let loop = setInterval(() => {
        stx += x / 10;
        sty += y / 10;
        let finishedX = x === 0 || (x > 0 ? stx >= x : stx <= x);
        let finishedY = y === 0 || (y > 0 ? sty >= y : sty <= y);
        if(finishedX) stx = x;
        if(finishedY) sty = y;
        element.style.transform = `translate(${stx}px, ${sty}px)`;
        if(finishedX && finishedY){
          clearInterval(loop);
          element.style.transform = 'translate(0px, 0px) scale(1) rotate(0deg)';
          piece.drop(piece,targetSquare,additionaMoves);
        }
    }, 10);
  }
  #handleClick(e){
    e.stopImmediatePropagation()   
    let board = game.getBoard() 
    let piece = board.getPiece(e.target.id)
    let clickedPiece = board.clickedPiece ? board.clickedPiece.id : board.clickedPiece
    if(clickedPiece != e.target.id && (clickedPiece == null || board.clickedColor == piece.getColor())){
     board.clickedPiece = e.target    
     board.clickedColor = piece.getColor()    
    }else{   
      let dragPiece = board.getPiece(clickedPiece)
      let startsquare = board.getSquare(dragPiece.getSquare())
      let startcoords = startsquare.decode()
      let dragpieceelem = document.getElementById(clickedPiece)
      let targetsquareelem = document.getElementById(piece.getSquare())
      let endcoords = board.getSquare(targetsquareelem.id).decode()     
      board.clickedPiece = null
      let sqwidth = targetsquareelem.getBoundingClientRect().width
      dragPiece.ClickAnimation(sqwidth,[startcoords.x,startcoords.y],[endcoords.x,endcoords.y],dragpieceelem,dragPiece,targetsquareelem)   
    }  
    if(board.clickedPiece != null && piece instanceof Piece) piece.drag(piece)  
  }
  drag(piece,additionalMoves = []){
    if(!piece) return
    if(game.hasEnded()) return
    let board = game.getBoard()   
    let moves = piece.createMoves().concat(additionalMoves)
    let pseudoMoves = piece.concatMoves().flat() 
    board.applySquaresColor(pseudoMoves,piece.getColor())
    piece.#highlightstartsquare()   
    let turnColor = board.getTurnTeam()   
    //Check if the moving piece can move by turn   
    if(turnColor != piece.getColor()) return
    board.removeSquaresColor()
    board.highlightLastMove()
    board.applySquaresColor(moves,piece.getColor())
    piece.#highlightstartsquare()
  }
  drop(piece,targetSquare,additionalMoves = []){
    let board = game.getBoard()   
    board.MovePiece(piece,targetSquare,additionalMoves)       
  }
  updateDetails(targetSquare){
   let {x,y} = targetSquare.decode()
   this.setX(x)
   this.setY(y)
   this.setSquare(targetSquare.getName())
  }
  static getData(name){
   if(!name) return
   let nameArr = Array.from(name)
   let index_ = nameArr.indexOf("_")
   let type = name.slice(0,index_)
   let color = nameArr[nameArr.length - 1] == "w" ? "white" : "black"
   return {type,color}
  }
  createElement(){
    let piece = document.createElement("img")
    piece.id = this.getName()
    piece.classList.add("pieces",`${this.getColor()}`)
    piece.src = `../images/${this.getimagesrc()}`
    let square = document.getElementById(this.getSquare())
    square.appendChild(piece)
    return piece
  }
  removeElement(){
    let square = document.getElementById(this.getSquare())
    let piece = this.#pieceElement
    square.removeChild(piece)
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
  removeIllegalMoves(moves){
    let legalMoves = []
    let board = game.getBoard()
    let color = this.getColor()
    let pieceSquare = board.getSquare(this.getSquare())
    let king = board.getPiece(`king_${color[0]}`)
    moves.forEach(move =>{
      let square = board.getSquare(move)
      let piecename = square.getpieceName()
      board.setPiecePosition(this,square)
      if(!king.isInCheck()) legalMoves.push(square.getName())
      board.setPiecePosition(this,pieceSquare,piecename)
    })
    return legalMoves
  }
  #highlightstartsquare(){
    let colorRGB = "rgb(74, 236, 0)"
    let square = game.getBoard().getSquare(this.getSquare())   
    square.applyColor("lime",colorRGB)
  }
  setpieceElem(){
    let piece = document.getElementById(this.getName())
    this.#pieceElement = !piece ? this.createElement() : piece
  }
  #setimagesrc(){
  let src = Piece.imagesSrc[this.getColor()][this.getType()]
  this.#imagesrc = src
  }
  getimagesrc(){
    return this.#imagesrc
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
    let moves = Square.exists(this.getX(),this.getY()) ? [this.createUpMoves(),this.createDownMoves(),this.createLeftMoves(),this.createRightMoves()] : []
    return moves    
  }
  createMoves(){  
    let moves = this.concatMoves().map(moves => this.cutDirection(moves)).flat()
    return this.removeIllegalMoves(moves)
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
    let moves = Square.exists(this.getX(),this.getY()) ? [this.createAllMoves()] : []
    return moves
  }
  cutDirection(moves){
    let newmoves = []
    let board = game.getBoard()
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
    let moves = this.cutDirection(this.concatMoves().flat())
    return this.removeIllegalMoves(moves)
  }
}

class Bishop extends Piece{
  constructor(color,name,square,type,x,y){
    super(color,name,square,type,x,y)
  }      
  concatMoves(){
    let moves = Square.exists(this.getX(),this.getY()) ? [this.createRightUpMoves(),this.createLeftUpMoves(),this.createRightDownMoves(),this.createLeftDownMoves()] : []
    return moves
  }
  createMoves(){ 
    let moves = this.concatMoves().map(moves => this.cutDirection(moves)).flat()
    return this.removeIllegalMoves(moves)
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
    let moves = this.concatMoves().map(moves => this.cutDirection(moves)).flat()
    return this.removeIllegalMoves(moves)
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
    let moves = Square.exists(this.getX(),this.getY()) ? [this.createAllMoves()] : []
    return moves
  }
  TranferRook(rookName){
    let allPieces = game.getBoard().getPieceNames()
    if(!allPieces.includes(rookName)) return
  }
  Castle(){}
  isInCheck(){
    let board = game.getBoard()
    let kingSquare = board.getSquare(this.getSquare())
    let isCheck = false
    if(board.isSquareControlled(this.getColor(),kingSquare)) isCheck = true
    return isCheck
  }
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
    let board = game.getBoard()
    moves.forEach(move =>{
      let square = board.getSquare(move)
      let hasPiece = square.hasPiece()      
      let hasEnemyPiece = square.hasEnemyPiece(this.getColor())
      if(!hasPiece || hasEnemyPiece) newmoves.push(move)
    })  
    return newmoves
  }
  createMoves(){
    let moves = this.cutDirection(this.concatMoves().flat())  
    return this.removeIllegalMoves(moves)
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
    this.#moved2 = Math.abs(startY - endY) == 2 ? true : false
  }
  isPromotion(color,y){
    let promoteY = color == "white" ? 7 : 2
    let promoteColor = promoteY == 7 ? "white" : promoteY == 2 ? "black" : false
    return y == promoteY && this.getColor() == promoteColor
  }
  OpenPromotion(target){
    let promotion = document.getElementById("promotion")
    Board.promotionData = {color:this.getColor(),square:this.getSquare(),x:this.getX(),y:this.getY(),targetSquare:target,pawnid:this.getName()}
    promotion.style.display = "flex"
  }
  static Promote(type){
    let pieceData = Board.promotionData
    if(!pieceData) return 
    let color = pieceData.color == "white" ? "w" : "b"
    let board = game.getBoard()
    let pieceId = `${type}_${board.getCounter()}${color}`
    let piece = Board.CreatePiece(pieceData.color,pieceId,pieceData.square,type,pieceData.x,pieceData.y)
    let startSquare = game.getBoard().getSquare(pieceData.square)
    let square = game.getBoard().getSquare(pieceData.targetSquare)
    let targetsquareelem = document.getElementById(pieceData.targetSquare)
    let removedPiece = game.getBoard().getPiece(pieceData.pawnid)
    board.removePiece(removedPiece.getName()) 
    board.addPiece(piece)      
    piece.drag(piece,[pieceData.targetSquare])
    let sqwidth = targetsquareelem.getBoundingClientRect().width
    let startcoords = startSquare.decode()
    let endcoords = square.decode()
    let pieceelem = document.getElementById(piece.getName())
    piece.ClickAnimation(sqwidth,[startcoords.x,startcoords.y],[endcoords.x,endcoords.y],pieceelem,piece,targetsquareelem,[pieceData.targetSquare]) 
    Board.promotionData = null
    let promotion = document.getElementById("promotion")
    promotion.style.display = "none"
  }
  isEnPassant(color,y){
    const enpassantY = color == "white" ? 5 : 4;
    const enemyColor = color == "white" ? "black" : "white";
    const enpassantColor = enpassantY == 5 ? "white" : enpassantY == 4 ? "black" : null;
    const adder = color == "white" ? -1 : 1
    const board = game.getBoard()
    let result = {isEnPassant: false,square: null,targetSquare: null};
    if (y !== enpassantY || this.getColor() !== enpassantColor) return result;
    const enemyPawnSquare = Square.encode(this.getX(), this.getY() + adder);
    const pawn = new Pawn(color, "pawn", enemyPawnSquare, "pawn", this.getX(), this.getY() + adder);
    const moves = pawn.concatDiagonalMoves().flat();
    for (const move of moves) {
      const currSquare = board.getSquare(move);
      if (!currSquare.hasEnemyPiece(color)) continue;
      if (!currSquare.hasSpecificPiece("pawn", enemyColor)) continue;
      const pieceName = currSquare.getpieceName();
      const piece = board.getPiece(pieceName);
      if (!piece.getmoved2()) continue;
      if (board.getlast_move()[1] !== currSquare.getName()) continue;
      const {x:px,y:py} = currSquare.decode();
      const targetY = color == "white" ? py + 1 : py - 1;
      const enpassantSquare = Square.encode(px, targetY);
      result = {isEnPassant: true,square: enpassantSquare,targetSquare: currSquare.getName()};
      break;
    }
    return result;
  }
  EnPassant(targetPiece){
    game.getBoard().removePiece(targetPiece)
  }
  concatDiagonalMoves(){
    return [this.diagonalMove(1).concat(this.diagonalMove(-1))]
  }
  concatMoves(){
    let moves = Square.exists(this.getX(),this.getY()) ? [this.moveForward()].concat(this.concatDiagonalMoves()) : [];
    return moves
  }
  createMoves(){
    const enPassantResult = this.isEnPassant(this.getColor(), this.getY());
    let enpassant = enPassantResult.isEnPassant ? [enPassantResult.square] : [];  
    let moves = (this.concatMoves().map((moves,i) => i == 0 ? this.cutDirection(moves) : this.cutDiagonal(moves)).flat()).concat(enpassant) 
    return this.removeIllegalMoves(moves)
  }
  getDirection(color){
    return color === "white" ? 1 : -1
  }
  cutDiagonal(moves){
    let newmoves = []
    let board = game.getBoard()
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
    let board = game.getBoard()
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
  #ready = false
  #resolveBestMove = false
  #rejectBestMove = false
  constructor(name,team,role){
    super(name,team,role)
  }
  init(){//Game/stockfish/stockfish-19-lite-single.js small path "https://andreas-hodo.github.io/Chess/Game/stockfish/stockfish-19-lite-single.js"
    this.stockfish = new Worker("https://andreas-hodo.github.io/Chess/Game/stockfish/stockfish-19-lite-single.js");
    this.stockfish.onmessage = (event) => {
      const message = String(event.data).trim();
      if(message === "uciok") {
        this.stockfish.postMessage("isready");
      }
      if(message === "readyok") {
        this.#ready = true;
        console.log("Engine is ready!");      
      }
      if(message.startsWith("bestmove ")) {
        this.bestMove = message.split(/\s+/)[1];
        if(this.#resolveBestMove) {
          this.#resolveBestMove(this.bestMove);
         this.#resolveBestMove = null;
          this.#rejectBestMove = null;
        }
      }
    };
    this.stockfish.onerror = (event) => {
      console.error("Worker error:", event.message);
    };
    this.stockfish.postMessage("uci");
  }
  getBestMove(fen) {
    return new Promise((resolve, reject) => {
      if (!this.#ready) {
        reject(new Error("Stockfish is not ready."));
        return;
      }
     this.#resolveBestMove = resolve;
     this.#rejectBestMove = reject;
      this.stockfish.postMessage(`position fen ${fen}`);
      this.stockfish.postMessage("go depth 15");
    });
  }
  async Move(){
    let board = game.getBoard() 
    if(!game.Started() || game.hasEnded()) return
    if(this.getTeam() != board.getTurnTeam()) return
    if(this.getRole() != "bot") return     
    try{
      const currentfen = board.getstrFen();
      const bestMove = await this.getBestMove(currentfen);
      if (!bestMove || bestMove === "(none)") return;
      let pieces = {r:"rook",n:"knight",b:"bishop",q:"queen"}
      const [stsq, endsq, prom] = bestMove.match(/.{1,2}/g);
      const pieceElem = document.getElementById(stsq).childNodes[0];
      const piece = board.getPiece(pieceElem.id);
      const square = document.getElementById(endsq);
      const squareData = [stsq, endsq].map(sq => {
      const sqobj = board.getSquare(sq);
        return Object.values(sqobj.decode());
      });
      let sqwidth = square.getBoundingClientRect().width
      //piece.drag();
      //piece.ClickAnimation();
      //if(prom) setTimeout(() =>{new Pawn().Promote(pieces[prom])},100)   
    }catch (error) {
      alert("Something went wrong with Engine!");
      console.error(error.message)
    }
  }
  getReady(){
    return this.#ready
  }
}

let promotePieces = document.querySelectorAll(".promote_pieces")
promotePieces.forEach(piece =>{piece.addEventListener("click",(e) =>{Pawn.Promote(e.target.id)})})
let flipButton = document.querySelector(".board-flip-button")
flipButton.addEventListener("click",() =>{game.getBoard().flip()})
let soundButton = document.querySelector("#volume");
let FENButton = document.querySelector(".Fenbtn");
FENButton.addEventListener("click",() =>{game.getBoard().copyFen()})
soundButton.addEventListener("click",() =>{game.changeSoundAllowed()})
let DownloadButton = document.querySelector(".fa-download");
DownloadButton.addEventListener("click",() =>{game.download()})
let replayButton = document.querySelector("#btn");
replayButton.addEventListener("click",() =>{game.playAgain()})
let startbtn = document.querySelector("#startGame")
startbtn.addEventListener("click",()=>{
  let resignbtn = document.querySelector("#resign_btn")
  resignbtn.style.opacity = "1"
  resignbtn.addEventListener("click",()=>{Player.resign()},{once:true})
  game.Start()
})


const player1 = new Player("Black","black","user")
const player2 = new Player("White","white","user")
let engine = null
let time = 600
let white = new Timer(time,"white")
let black = new Timer(time,"black")
let squares = Board.createSquares()
let pieces = Board.createPieces(squares)
const board = new Board(pieces,squares)
const game = new Game(board,{player1,player2},{white,black})
console.log("Chess version 5!");