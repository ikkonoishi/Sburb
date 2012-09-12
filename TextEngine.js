/*Sburb.Dialoger is in
command.js
Jterniabound.js
serialization.js

Sburb.Chooser is in
command.js
Jterniabound.js
serialization.js

Sburb.FontEngine is in
Chooser.js
Dialoger.js

*/
var Sburb = (function(Sburb){



////////////////////////////////////////////////
//TextEngine class
////////////////////////////////////////////////

//constructor
Sburb.TextEngine = function(parsing, parser, renderer){
	this.parsing = parsing?parsing:this.PARSE_NONE;
	this.parser = parser?parser:this.PARSER_DEFAULT;
	this.renderer =  renderer?renderer:this.RENDERER_DEFAULT;
	if (this.parser)this.parser=new this.parser();
	if (this.renderer)this.renderer=new this.renderer();
}

//static constants
Sburb.TextEngine.prototype.PARSE_NONE = "none";
Sburb.TextEngine.prototype.PARSE_SINGLE = "single";
Sburb.TextEngine.prototype.PARSE_MULTI = "multi";

//These two will be changed once the definitions for the default objects have been created.
Sburb.TextEngine.prototype.PARSER_DEFAULT = null;
Sburb.TextEngine.prototype.RENDERER_DEFAULT = null;

//draw the text
Sburb.TextEngine.prototype.draw = function(){
	this.renderer.draw();
}

//set the default style
//underline: false, true
//colour: #000000
//font: font
Sburb.TextEngine.prototype.setStyle = function(styleName, value){
	this.parser.setStyle(styleName,value);
}

//set if any parsing should apply (PARSE_NONE, PARSE_SINGLE, PARSE_MULTI)
Sburb.TextEngine.prototype.setParsing = function(parsing){
	this.parsing = parsing;
}

Sburb.TextEngine.prototype.setTextSpeed = function(textSpeed){
	this.renderer.setTextSpeed(textSpeed);
}

//set the text
Sburb.TextEngine.prototype.setText = function(text){
	if(this.parsing==this.PARSE_NONE){
		this.parser.parseNone(text);
	}else if(this.parsing==this.PARSE_SINGLE){
		this.parser.parseNoBatch(text);
	}else if(this.parsing==this.PARSE_MULTI){
		this.parser.parseFull(text);
	}
	this.renderer.setBatches(this.parser.getBatches());
	this.renderer.setActors(this.parser.getActors());
	this.renderer.setAnimations(this.parser.getAnimations());
	this.renderer.setBoxes(this.parser.getBoxes());
	this.renderer.setBackgrounds(this.parser.getBackgrounds());
	this.renderer.setExtras(this.parser.getExtras());
	this.renderer.setStyles(this.parser.getStyles());
}

//show a substring of the text
Sburb.TextEngine.prototype.showSubText = function(start,end){
	this.renderer.showSubText(start,end);
}

//set the dimensions
Sburb.TextEngine.prototype.setDimensions = function(x,y,width,height){
	this.renderer.setDimensions(x,y,width,height);
}

//is all the text that can fit in the current box showing?
Sburb.TextEngine.prototype.isShowingWholeBox = function(){
	return this.renderer.isShowingAll();
}

//show all the text that can fit in the current box
Sburb.TextEngine.prototype.showWholeBox = function(){
	return this.renderer.showAll();
}

//show a bit more of the text
Sburb.TextEngine.prototype.showMoreOfBox = function(){
	this.renderer.showMoreOfBox();
}

//is there another box of text in this batch?
Sburb.TextEngine.prototype.hasNextBox = function(){
	return this.renderer.hasNextBox();
}

//show the next box
Sburb.TextEngine.prototype.nextBox = function(){
	return this.renderer.nextBox();
}

//show the next batch of text
Sburb.TextEngine.prototype.nextBatch = function(){
	this.renderer.nextBatch();
}

//is there another batch of text (e.g. each time the character changes that's usually a "batch")?
Sburb.TextEngine.prototype.hasNextBatch = function(){
	return this.renderer.hasNextBatch();
}

//get the actor assigned to the current batch
Sburb.TextEngine.prototype.getActor = function(){
	return this.renderer.getActor();
}

//get the animation assigned to the current batch
Sburb.TextEngine.prototype.getAnimation = function(){
	return this.renderer.getAnimation();
}

//get the box assigned to the current batch
Sburb.TextEngine.prototype.getBox = function(){
	return this.renderer.getBox();
}

//get the background assigned to the current batch
Sburb.TextEngine.prototype.getBackground = function(){
	return this.renderer.getBackground();
}

//get any extra information assigned to the current batch
Sburb.TextEngine.prototype.getExtra = function(){
	return this.renderer.getExtra();
}

//get the style assigned to the current batch
Sburb.TextEngine.prototype.getStyle = function(){
	return this.renderer.getStyle();
}

//This holds formatting templates which will tell both the renderer and the parser how to handle formatting tags
//This may be absolutely retarted, but I think that having this out of the main classes is useful.
//I will most likely move these elsewhere eventually.
Sburb.TextEngine.prototype.formattingMarks = {
	underline: {
		match: function (text) {
			  	var regex = new RegExp("(/)?_","g");
			  	var info = new Array();
				var match = regex.exec(text);
						  
				while (match)
			 	{
			 		//If the pattern matched the escape character
			 		if (match[1])
					{
						//We should skip the escape character, and ignore the underscore
						info.push({start:match.index,type:"isformat",value:true});
						info.push({start:match.index+match[1].length,type:"isformat",value:false});
			 		}
			 		else
			 		{
			 			//We should skip the tag, and set formatting
			 			info.push({start:match.index,type:"isformat",value:true});
			 			info.push({start:match.index+match[0].length,type:"isformat",value:false});
						info.push({start:match.index,type:"underline",toggle:true});
			 		}
			 		match = regex.exec(text);
			 	}
			 	return info;
		 },
		render: function(context,style,text,boxinfo){
			if(Sburb.stage.lineWidth!=0.6){
					Sburb.stage.lineWidth = 0.6;
			}
			if(Sburb.stage.lineCap!="square"){
				Sburb.stage.lineCap = "square";
			}
			
			//canvas tags are weird about lines.
			//they draw them much better if you stradle pixels. 
			//So I offset this by half a pixel vertically
			var reg = /[^\s]+[\s]?/g;
			var word = reg.exec(text);
			var x = boxinfo.x,y=boxinfo.y;
			//word up holmes
			while(word)
			{

				if (Sburb.stage.measureText(word[0]).width+x>=boxinfo.maxX)
				{
					x = 0;
					y += boxinfo.lineheight;
				}
				Sburb.stage.beginPath();
				Sburb.stage.moveTo(x,y+0.5);
				Sburb.stage.lineTo(x+context.measureText(word[0]).width,y+0.5);
				Sburb.stage.closePath();
				Sburb.stage.stroke();
				x+=Sburb.stage.measureText(word[0]).width;
				var word = reg.exec(text);
			}
		}
			 	
	},
	color	: {
		match: function (text) {
			  	var regex = new RegExp("/0x((?:#[a-fA-F0-9]{6})?)/","g");
			  	var info = new Array();
				var match = regex.exec(text);
						  
				while (match)
			 	{
			 		//If the pattern matched the escape character
			 				
		 			//We should skip it, and set formatting
		 			info.push({start:match.index,type:"isformat",value:true});
		 			info.push({start:match.index+match[0].length,type:"isformat",value:false});
		 			if (match[1].length==7)
						info.push({start:match.index,type:"color",value:match[1]});
					else
						info.push({start:match.index,type:"color",toggle:true});
			 		
			 		
			 		match = regex.exec(text);
			 	}
			 	return info;

		 },
		render: function(context,style,text,boxinfo){
			Sburb.stage.strokeStyle = Sburb.stage.fillStyle = style;
			return false; //dont skip future rendering
		}
			 	
	},
	isformat : {
		match: function(text){},
		render: function(context,style,text,boxinfo)
		{
			return style; //If this text is formatting return true to prevent it being rendered.
		}
		
	},
	font 	: {
		match: function (text) {},
		render: function (context,style,text,boxinfo)
		{
			context.font = style;
			return false;
		}
	}
	
	
	
}



////////////////////////////////////////////////////////
//Abstract TextParser
////////////////////////////////////////////////////////

//Constructor
Sburb.TextParser = function(){
	this.batches = null;
	this.actors = null;
	this.animations = null;
	this.boxes = null;
	this.backgrounds = null;
	this.extras = null;
	this.styles = null;
	this.defaultStyles = new Sburb.TextStyleToken(-1,{font: "bold 14px SburbFont",color: "#000000"});
}

Sburb.TextEngine.prototype.PARSER_DEFAULT = Sburb.TextParser;

//static constants
Sburb.TextParser.ACTOR_COLORS = {	
	aa : "#a10000",aradia : "#a10000",
	ac : "#416600",nepeta : "#416600",
	ag : "#005682",vriska : "#005682",
	at : "#a15000",tavros : "#a15000",
	ca : "#6a006a",eridan : "#6a006a",
	cc : "#77003c",feferi : "#77003c",
	cg : "#626262",karkat : "#626262",
	ct : "#000056",equius : "#000056",
	ga : "#008141",kanaya : "#008141",
	gc : "#008282",terezi : "#008282",
	ta : "#a1a100",sollux : "#a1a100",
	tc : "#2b0057",gamzee : "#2b0057",
	dave:"#e00707",meenah : "#77003c",
	rose:"#b536da",aranea : "#005682",
	kankri:"#ff0000",porrim: "#008141",
	latula:"#008282"
};


//////////////ABSTRACT METHODS////////////////////////////////

Sburb.TextParser.prototype.parseNone = function(text) {
	this.parseBatches(text,true);
	this.parseStyles(true)
}

Sburb.TextParser.prototype.parseNoBatch = function(text) {
	this.parseBatches(text,true);
	this.parseStyles(false)
}

Sburb.TextParser.prototype.parseFull = function(text) {
	this.parseBatches(text,false);
	this.parseStyles(false)
}

Sburb.TextParser.prototype.parseBatches = function(text,nobatch){
	this.batches = new Array()
	this.actors = new Array();
	this.animations = new Array();
	this.backgrounds = new Array();
	this.extras = new Array();
	
	this.boxes = new Array();
	this.styles = new Array();
	 
	
    var lines = new Array();
    
    var splittext = text.split("\n");
    if (nobatch)
    {
    	this.batches=splittext;
    	this.actors = new Array(splittext.length);
		this.animations = new Array(splittext.length);
		this.backgrounds = new Array(splittext.length);
		this.extras = new Array(splittext.length);
		
		this.boxes = new Array(splittext.length);
		return;
    }
    for (var i = 0;i<splittext.length;i++)
    {
        var line = splittext[i].match(/(@[^:\s]+)(:[^\s]*)?\s([^\n]*)/);
        if (!line)
        {
        	continue;
        }
        var extra = line[2]?line[2]:"";
        var metadata = line[1].match(/([@_~%])([^@_~%]+)/g);
        var actor = null;
        var animation = null;
        var background = null;
        var box = null;
        //Metadata types can be determined by the first character
        // @ = actor
        // _ = animation
        // ~ = textbox image
        // % = background image (box)
        // : = extra info/hashtags (must be last)
        // We might want to add a metadata type for not parsing for formatting 
        // so people don't have to do a lot of underscore escaping
        while (metadata.length > 0)
        {
            var mdItem = metadata.pop();
			if (mdItem[0] == "@")
				actor 		= mdItem;
			if (mdItem[0] == "_")
				animation 	= mdItem;
			if (mdItem[0] == "~")
				background 	= mdItem;
			if (mdItem[0] == "%")
				box 		= mdItem;
        }
        //If there isn't an "_" deliminated animation fall back to the @CGIdle method
        if (animation == ""&& !actor)
        {
        	animation = actor.substr(2,actor.length-2);
        	actor = actor.substr(0,2);
        }
        this.batches.push(line[3]?line[3]:"");
        this.actors.push(actor);
        this.animations.push(animation);
        this.backgrounds.push(background);
        this.boxes.push(box);
    }
}



Sburb.TextParser.prototype.parseStyles = function(onlydefault){
	//process the base text
	this.styles = new Array();
	for (var i=0;i<this.batches.length;i++)
	{

		this.styles[i] = new Array();
		this.styles[i].push(this.defaultStyles.clone(0));
		
		//If we are only setting the default style then skip the rest.		
		if (onlydefault) continue;
		
		if (this.actors[i])
			this.styles[i][0].styles.color = Sburb.TextParser.ACTOR_COLORS[this.actors[i].substr(1,this.actors[i].length-1)];

		//this is an intermediary style. It will be sorted and parsed to the actual style.
		var batchStyle = new Array();
		var fMarks = Sburb.TextEngine.prototype.formattingMarks;
		
		for (var fmark in fMarks)
		{
			//Have each formatting mark find its tags
			var returnedStyle=fMarks[fmark].match(this.batches[i]);
			if (typeof returnedStyle == "object")
				batchStyle = batchStyle.concat(returnedStyle);
		}
		
		batchStyle.sort(function(a,b){return a.start-b.start});
		
		var curStyle = batchStyle.shift();
		while (curStyle)
		{
			var found = -1;
			var j;
			for (j=0;j<this.styles[i].length&&this.styles[i][j].index<=curStyle.start;j++)
			{
				if (this.styles[i][j].index==curStyle.start)
				{
					found=j;
					break;
				}
			}
			if (found<0)
			{
				found = this.styles[i].push(this.styles[i][j-1].clone(curStyle.start))-1;
			}
			if ('toggle' in curStyle)
			{
				if(curStyle.type in this.styles[i][found].styles&&this.styles[i][found].styles[curStyle.type])
					delete this.styles[i][found].styles[curStyle.type];
				else
					this.styles[i][found].styles[curStyle.type] = true;
			}
			if ('value' in curStyle)
			{
				//if the value tag was added, but is false or empty use the default style 
				if (curStyle.type in this.styles[i][0].styles&&!curStyle.value) curStyle.value = this.styles[i][0].styles[curStyle.type];
				this.styles[i][found].styles[curStyle.type] = curStyle.value;
			}
			
			curStyle = batchStyle.shift();
		}
		
	}
}



/////////////NON-ABSTRACT METHODS/////////////////////////////

//Set the default value for the given style
Sburb.TextParser.prototype.setStyle = function(styleName, value){
	this.defaultStyles[styleName] = value;
}

//Array of cleaned text, as it should be rendered
Sburb.TextParser.prototype.getBatches = function(){return this.batches}
//Array of actors associated with each batch
Sburb.TextParser.prototype.getActors = function(){return this.actors}
//Array of animations associated with each batch
Sburb.TextParser.prototype.getAnimations = function(){return this.animations}
//Array of boxes associated with each batch
Sburb.TextParser.prototype.getBoxes = function(){return this.boxes}
//Array of backgrounds associated with each batch
Sburb.TextParser.prototype.getBackgrounds = function(){return this.backgrounds}
//Array of extras associated with each batch
Sburb.TextParser.prototype.getExtras = function(){return this.extras}
//Array of Arrays of TextStyleTokens (sorted by increasing index) associated with each batch
Sburb.TextParser.prototype.getStyles = function(){return this.styles}





///////////////////////////////////////////////////////
//TextStyleToken
///////////////////////////////////////////////////////

//constructor
Sburb.TextStyleToken = function(index, styles){
	this.index = index; //index of character where it comes into effect
	this.styles = styles; //map of styleNames to values (e.g. {font:"Courier", color:"#00ff00", italic:"false"})
}

Sburb.TextStyleToken.prototype.clone = function(newindex) {
	var ret = new Sburb.TextStyleToken(newindex!=null?newindex:this.index,{});
	for (var style in this.styles)
		ret.styles[style] = this.styles[style];
	return ret;
}



///////////////////////////////////////////////////////
//Abstract TextRenderer
///////////////////////////////////////////////////////

//constructor
Sburb.TextRenderer = function(){
	this.batches = [];
	this.actors = [];
	this.animations = [];
	this.boxes = [];
	this.backgrounds = [];
	this.extras = [];
	this.styles = [];
	
	this.currentBatch = 0;
	this.textSpeed = 2; //rate at which characters are revealed in showMoreOfBox()
	
	this.x = 0;
	this.y = 0;
	this.width = 0; //if <=0, unbounded width
	this.height = 0; //if <=0, unbounded height
}

Sburb.TextEngine.prototype.RENDERER_DEFAULT = Sburb.TextRenderer;

/////////////////////ABSTRACT METHODS//////////////////////

//show a substring of the text
Sburb.TextRenderer.prototype.showSubText = function(start,end){}

//is all the text that can fit in the current box showing?
Sburb.TextRenderer.prototype.isShowingWholeBox = function(){}

//show all the text that can fit in the current box
Sburb.TextRenderer.prototype.showWholeBox = function(){}

//show a bit more of the text
Sburb.TextRenderer.prototype.showMoreOfBox = function(){}

//is there another box of text in this batch?
Sburb.TextRenderer.prototype.hasNextBox = function(){}

//show the next box
Sburb.TextRenderer.prototype.nextBox = function(){}

//show the next batch of text
Sburb.TextRenderer.prototype.nextBatch = function(){}

//draw the text
Sburb.TextRenderer.prototype.draw = function(){
	var boxinfo={x:0,y:10,maxX:400,maxY:400,lineheight:10};
	Sburb.stage.fillStyle="#FFFFFF";
	Sburb.stage.fillRect(0,0,1150,1175);
	for (var batch = 0;batch<this.batches.length;batch++)
	{
		
		for (var i = 0;i<this.styles[batch].length;i++)
		{
			var length = 0;
					
			if (this.styles[batch][i+1])
				length = this.styles[batch][i+1].index-this.styles[batch][i].index;
			else length = this.batches[batch].length-i;
			var text = this.batches[batch].substr(this.styles[batch][i].index,length)
			
			var noDrawText = false;
			var priority = ["isformat","color","underline"]
			for (var formater = 0;formater<priority.length;formater++)
			{
				if (priority[formater] in this.styles[batch][i].styles)
				{
					noDrawText=noDrawText || Sburb.TextEngine.prototype.formattingMarks[priority[formater]].render(Sburb.stage,this.styles[batch][i].styles[priority[formater]],text,boxinfo);
				}
			}
			if (!noDrawText)
				{
					var reg = /[^\s]+[\s]?/g;
					var word = reg.exec(text);
					//word up holmes
					while(word)
					{
						if (Sburb.stage.measureText(word[0]).width+boxinfo.x>=boxinfo.maxX)
						{
							boxinfo.x = 0;
							boxinfo.y += 10;
						}
						Sburb.stage.fillText(word[0],boxinfo.x,boxinfo.y,Sburb.stage.measureText(word[0]).width);
						boxinfo.x+=Sburb.stage.measureText(word[0]).width;
						var word = reg.exec(text);
					}	
				}
		}
		boxinfo.y+=boxinfo.lineheight;
		boxinfo.x=0;
	}	
}

//reset back to batch 0
Sburb.TextRenderer.prototype.reset = function(){
	
}

/////////////////////////NON-ABSTRACT METHODS///////////////////////////

//set the dimensions
Sburb.TextRenderer.prototype.setDimensions = function(x,y,width,height){
	this.x = typeof x == "number" ? x : this.x;
	this.y = typeof y == "number" ? y : this.y;
	this.width = typeof width == "number" ? width : this.width;
	this.height = typeof height == "number" ? height : this.height;
}

Sburb.TextRenderer.prototype.setBatches = function(batches){this.batches = batches;}
Sburb.TextRenderer.prototype.setActors = function(actors){this.actors = actors;}
Sburb.TextRenderer.prototype.setAnimations = function(animations){this.animations = animations;}
Sburb.TextRenderer.prototype.setBoxes = function(boxes){this.boxes = boxes;}
Sburb.TextRenderer.prototype.setBackgrounds = function(backgrounds){this.backgrounds = backgrounds;}
Sburb.TextRenderer.prototype.setExtras = function(extras){this.extras = extras;}
Sburb.TextRenderer.prototype.setStyles = function(styles){this.styles = styles;}
Sburb.TextRenderer.prototype.setTextSpeed = function(textSpeed){this.textSpeed = textSpeed;}

//is there another batch of text (e.g. each time the character changes that's usually a "batch")?
Sburb.TextRenderer.prototype.hasNextBatch = function(){return this.batches.length-1<this.currentBatch}

//get the actor assigned to the current batch
Sburb.TextRenderer.prototype.getActor = function(){return this.actors[this.currentBatch]}

//get the animation assigned to the current batch
Sburb.TextRenderer.prototype.getAnimation = function(){return this.animations[this.currentBatch]}

//get the box assigned to the current batch
Sburb.TextRenderer.prototype.getBox = function(){return this.boxes[this.currentBatch]}

//get the background assigned to the current batch
Sburb.TextRenderer.prototype.getBackground = function(){return this.boxes[this.currentBatch]}

//get any extra information assigned to the current batch
Sburb.TextRenderer.prototype.getExtra = function(){return this.extras[this.currentBatch]}

//get the style assigned to the current batch
Sburb.TextRenderer.prototype.getStyle = function(){return this.styles[this.currentBatch]}






return Sburb;
})(Sburb || {});

