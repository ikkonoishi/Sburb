//requires Character.js
//650x450 screen
var Keys = {backspace:8,tab:9,enter:13,shift:16,ctrl:17,alt:18,escape:27,space:32,left:37,up:38,right:39,down:40,w:87,a:65,s:83,d:68};

var Stage; //the canvas, we're gonna load it up with a bunch of flash-like game data like fps and scale factors
var stage; //its context
var updateLoop; //the main updateLoop, used to interrupt updating
var pressed; //the pressed keys
var assetManager; //the asset loader
var assets; //all images, sounds, paths
var sprites; //all sprites that were Serial loaded
var effects; //all effects that were Serial loaded
var rooms; //all rooms
var effects; //all effects 
var char; //the player
var curRoom,destRoom; //current room, the room we are transitioning to, if it exists.
var destX,destY; //the desired location in the room we are transitioning to, if it exists.
var focus; //the focus of the camera (a sprite), usually just the char
var chooser; //the option chooser
var curAction; //the current action being performed
var bgm; //the current background music
var hud; //the hud; help and sound buttons
var Mouse = {down:false,x:0,y:0}; //current recorded properties of the mouse
var waitFor = null;

var initFinished; //only used when _hardcode_load is true
var _hardcode_load; //set to 1 when we don't want to load from XML: see initialize()

function initialize(){
	var gameDiv = document.getElementById("gameDiv");
	gameDiv.onkeydown = _onkeydown;
	gameDiv.onkeyup = _onkeyup;
	Stage = document.getElementById("Stage");	
	Stage.scaleX = Stage.scaleY = 3;
	Stage.x = Stage.y = 0;
	Stage.fps = 30;
	Stage.fade = 0;
	Stage.fadeRate = 0.1;
	
	stage = Stage.getContext("2d");
	
	chooser = new Chooser();
	dialoger = new Dialoger();
    assetManager = new AssetManager();
	assets = assetManager.assets; // shortcut for raw asset access
	rooms = {};
	sprites = {};
	commands = {};
	effects = {};
	hud = {};
	pressed = new Array();
	buildCommands();
	
    loadSerialFromXML("levels/test2.xml"); // comment out this line and
    //loadAssets();                        // uncomment these two lines, to do a standard hardcode load
    //_hardcode_load = 1;
}

function update(gameTime){
	//update stuff
	handleInputs();
	handleHud();
	
	curRoom.update(gameTime);
	
	focusCamera();
	handleRoomChange();
	chooser.update(gameTime);
	dialoger.update(gameTime);
	chainAction();
	updateWait();
	
	//must be last
    
	updateLoop=setTimeout("update("+(gameTime+1)+")",1000/Stage.fps);
	draw(gameTime);
}

function draw(gameTime){
	//stage.clearRect(0,0,Stage.width,Stage.height);
	
	stage.save();
	Stage.offset = true;
	stage.translate(-Stage.x,-Stage.y);
	
	curRoom.draw();
	chooser.draw();
	
	stage.restore();
	Stage.offset = false;
	dialoger.draw();
	
	if(Stage.fade>0.1){
		stage.fillStyle = "rgba(0,0,0,"+Stage.fade+")";
		stage.fillRect(0,0,Stage.width,Stage.height);
	}
	
	drawHud();
}

var _onkeydown = function(e){
	if(chooser.choosing){
		if(e.keyCode == Keys.down || e.keyCode==Keys.s){
			chooser.nextChoice();
		}
		if(e.keyCode == Keys.up || e.keyCode==Keys.w){
			chooser.prevChoice();
		}
		if(e.keyCode == Keys.space && !pressed[Keys.space]){
			performAction(chooser.choices[chooser.choice]);
			chooser.choosing = false;
		}
	}else if(dialoger.talking){
		if(e.keyCode == Keys.space && !pressed[Keys.space]){
			dialoger.nudge();
		}
	}else{
		if(e.keyCode == Keys.space && !pressed[Keys.space]){
			chooser.choices = new Array();
			var queries = char.getActionQueries();
			for(var i=0;i<queries.length;i++){
				chooser.choices = curRoom.queryActions(char,queries[i].x,queries[i].y);
				if(chooser.choices.length>0){
					break;
				}
			}
			if(chooser.choices.length>0){
				chooser.choices.push(new Action("cancel","cancel","cancel"));
				beginChoosing();
			}
		}
	}
	pressed[e.keyCode] = true;
    // return true if we want to pass keys along to the browser, i.e. Ctrl-N for a new window
    if(e.altKey || e.ctrlKey || e.metaKey) {
		// don't muck with system stuff
		return true;
    }
    return false;
}

var _onkeyup = function(e){
	pressed[e.keyCode] = false;
}

function onMouseMove(e,canvas){
	point = relMouseCoords(e,canvas);
	Mouse.x = point.x;
	Mouse.y = point.y;
}

function onMouseDown(e,canvas){
	Mouse.down = true;
}

function onMouseUp(e,canvas){
	Mouse.down = false;
	dialoger.nudge();
}

function relMouseCoords(event,canvas){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = canvas;

    do{
        totalOffsetX += currentElement.offsetLeft;
        totalOffsetY += currentElement.offsetTop;
    }
    while(currentElement = currentElement.offsetParent)
    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;
    return {x:canvasX,y:canvasY};
}

function drawLoader(){
	stage.fillStyle = "rgb(240,240,240)";
	stage.fillRect(0,0,Stage.width,Stage.height);
	stage.fillStyle = "rgb(200,0,0)"
	stage.font="30px Arial";
    stage.fillText("Loading Assets: "+assetManager.totalLoaded+"/"+assetManager.totalAssets,100,200);
}

function handleInputs(){
	if(hasControl()){
		if(pressed[Keys.down] || pressed[Keys.s]){
			char.moveDown(curRoom);
		}else if(pressed[Keys.up] || pressed[Keys.w]){
			char.moveUp(curRoom);
		}else if(pressed[Keys.left] || pressed[Keys.a]){
			char.moveLeft(curRoom);
		}else if(pressed[Keys.right] || pressed[Keys.d]){
			char.moveRight(curRoom);
		}else{
			char.idle();
		}
	}
}

function handleHud(){
	for(var content in hud){
		var obj = hud[content];
		if(obj.updateMouse){
			obj.updateMouse(Mouse.x,Mouse.y,Mouse.down);
			obj.update(1);
			if(obj.clicked && obj.action){
				performAction(obj.action);
			}
		}
	}
}

function drawHud(){
	for(var content in hud){
		hud[content].draw();
	}
}

function hasControl(){
	return !dialoger.talking && !chooser.choosing && !destRoom && !waitFor;
}

function performAction(action){
	if(action.silent){
		performActionSilent(action);
		return;
	}
	if(((curAction &&curAction.followUp!=action) || !hasControl()) && action.soft){
		return;
	}
	
	var looped = false;
	curAction = action.clone();
	do{
		if(looped){
			curAction = curAction.followUp.clone();
		}
   	performActionSilent(curAction);
   	looped = true;
   }while(curAction.times<=0 && curAction.followUp && curAction.followUp.noDelay);
}

function performActionSilent(action){
	action.times--;
	commands[action.command.trim()](action.info.trim());
}

function focusCamera(){
	//need to divide these by scaleX and scaleY if repurposed
	Stage.x = Math.max(0,Math.min(focus.x-Stage.width/2,curRoom.width-Stage.width));
	Stage.y = Math.max(0,Math.min(focus.y-Stage.height/2,curRoom.height-Stage.height));
	Stage.x = Math.round(Stage.x/3)*3;
	Stage.y = Math.round(Stage.y/3)*3;
}

function changeRoom(newRoom,newX,newY){
	destRoom = newRoom;
	destX = newX;
	destY = newY;
}

function handleRoomChange(){
	if(destRoom){
		if(Stage.fade<1){
			Stage.fade=Math.min(1,Stage.fade+Stage.fadeRate);
		}else {
			char.x = destX;
			char.y = destY;
			moveSprite(char,curRoom,destRoom);
			curRoom.exit();
			curRoom = destRoom;
		    curRoom.initialize();
			destRoom = null;
		}
	}else if(Stage.fade>0.01){
		Stage.fade=Math.max(0.01,Stage.fade-Stage.fadeRate);
		//apparently alpha 0 is buggy?
	}
}

function moveSprite(sprite,oldRoom,newRoom){
	oldRoom.removeSprite(sprite);
	newRoom.addSprite(sprite);
}

function beginChoosing(){
	char.idle();
	chooser.beginChoosing(char.x,char.y);
}

function setCurRoomOf(sprite){
	if(!curRoom.contains(sprite)){
		for(var room in rooms){
			if(rooms[room].contains(sprite)){
				changeRoom(rooms[room],char.x,char.y);
				return;
			}
		}
	}
}

function changeBGM(newSong) {
    if(newSong){
		if(bgm) {
			if (bgm.priority > newSong.priority) {
				return;
			}
			if (bgm == newSong) {
				// maybe check for some kind of restart value
				return;
			}
			bgm.stop();
		}
		bgm = newSong;
		bgm.play();
    }
}

function playEffect(effect,x,y){
	curRoom.addEffect(effect.clone(x,y));
}

function playSound(sound){
	sound.stop();
	sound.play();
}

function playMovie(movie){
	var name = movie.src;
	document.getElementById("movieBin").innerHTML = ('<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" id="movie" width="550" height="400"><param name="allowScriptAccess" value="always" /\><param name="movie" value="'+name+'" /\><param name="quality" value="high" /\><param name="bgcolor" value="#ffffff" /\><embed src="'+name+'" quality="high" bgcolor="#ffffff" width="550" height="400" swLiveConnect=true id="movie" name="movie" allowScriptAccess="always" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" /\></object>');
	document.getElementById("gameDiv").style.display = "none";
	waitFor = new Trigger("movie,"+name+",1");
}
    
function chainAction(){
	if(curAction){
		if(curAction.times<=0){
			if(curAction.followUp){
				if(hasControl() || curAction.followUp.noWait){
					performAction(curAction.followUp);
				}
			}else{
				curAction = null;
			}
		}else if(hasControl() || curAction.noWait){
			performAction(curAction);
		}
	}
}    

function updateWait(){
	if(waitFor){
		if(waitFor.checkCompletion()){
			waitFor = null;
		}
	}
}

    
