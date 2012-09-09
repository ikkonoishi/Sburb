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
	this.renderer = renderer?renderer:this.RENDERER_DEFAULT;
}

//static constants
Sburb.TextEngine.prototype.PARSE_NONE = "none";
Sburb.TextEngine.prototype.PARSE_SINGLE = "single";
Sburb.TextEngine.prototype.PARSE_MULTI = "multi";

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
						info.push({start:match.index,length:match[1].length,type:"isformat",value:true});
			 		}
			 		else
			 		{
			 			//We should skip the tag, and set formatting
			 			info.push({start:match.index,length:match[0].length,type:"isformat",value:true});
						info.push({start:match.index,type:"underline",toggle:true});
			 		}
			 		match = regex.exec(text);
			 	}
			 	return info;
		 },
		render: function(){}
			 	
	},
	color: {
		match: function (text) {
			  	var regex = new RegExp("/0x#?([a-fA-F0-9]{6})/","g");
			  	var info = new Array();
				var match = regex.exec(text);
						  
				while (match)
			 	{
			 		//If the pattern matched the escape character
			 				
		 			//We should skip it, and set formatting
		 			info.push({start:match.index,length:match[0].length,type:"isformat",value:true});
					info.push({start:match.index,type:"color",toggle:true});
			 		
			 		
			 		match = regex.exec(text);
			 	}
			 	return info;

		 },
		render: function(){}
			 	
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
	this.defaultStyles = {};
}

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

//Text should come back as-is, still apply default styles
//Ikko Assumption {
//      If you aren't processing batches then each line is it's own batch.
//      I'm assuming that batching them combines lines that have the same actor and animation
// }
Sburb.TextParser.prototype.parseNone = function(text){
	this.batches = new Array()
	this.actors = new Array();
	this.animations = new Array();
	this.backgrounds = new Array();
	this.extras = new Array();
	
	this.boxes = new Array();//Ikko Question: Where should I get this information?
	this.styles = new Array();
	this.defaultStyles = {font: "bold 14px SburbFont",color: "#000000",underline: false }; 
	
    var lines = new Array();
    //master Index for all arrays
    var mI = 0;
    var splittext = text.split("\n");
    for (var i = 0;i<splittext.length;i++)
    {
        var line = splittext[i].match(/(@[^:\s]+)(:[^\s]*)?\s([^\n]*)/);
        if (!line)continue;
        var extra = line[2]?line[2]:"";
        var metadata = line[1].match(/([@_~%][^@_~%]+)/g);
        var actor = "@!";
        var animation = "";
        var background = "";
        //Metadata types can be determined by the first character
        // @ = actor
        // _ = animation
        // ~ = textbox image
        // % = background image
        // : = extra info/hashtags (must be last)
        // We might want to add a metadata type for not parsing for formatting 
        // so people don't have to do a lot of underscore escaping
        while (metadata.length > 0)
        {
            var mdItem = metadata.pop();
			if (mdItem.substr(0,1) == "@")
				actor = mdItem;
			if (mdItem.substr(0,1) == "_")
				animation = mdItem;
			if (mdItem.substr(0,1) == "~")
				background = mdItem;
        }
        this.batches.push(line[3]?line[3]:"\n");
        this.actors.push(actor);
        this.animations.push(animation);
        this.backgrounds.push(background);
    }
}
//Text should come back with styles applied, but nothing to do with batches
Sburb.TextParser.prototype.parseNoBatch = function(text){
	//process the base text
	this.parseNone(text);
	this.styles = new Array();
	for (var i=0;i<this.batches.length;i++)
	{
		var batchStyle = new Array();
		batchStyle = batchStyle.concat(Sburb.TextEngine.prototype.formattingMarks.underline.match(this.batches[i]));
		batchStyle = batchStyle.concat(Sburb.TextEngine.prototype.formattingMarks.color.match(this.batches[i]));
	}
}
//Text should come back with styles applied, and batching applied
Sburb.TextParser.prototype.parseFull = function(text){
	//first process the formatting and base text
	this.parseNoBatch(text)
	//I really think batching (assuming that batching is dividing the text up to fit in the text boxes)
	// should be done in the renderer. The parser really has no business thinking about what the text
	// will look like on screen.
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
Sburb.TextRenderer.prototype.draw = function(){}

//reset back to batch 0
Sburb.TextRenderer.prototype.reset = function(){}

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

