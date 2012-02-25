function Action(name,sprite,command,info){
	this.sprite = sprite;
	this.name = name;
	this.command = command
	this.info = info;
	
	this.serialize = function(output){
		var spriteName = "null";
		if(sprite){
			spriteName = this.sprite.name;
		}
		output = output.concat("<Action sprite='"+spriteName+"' name='"+this.name+"' command='"+this.command+"' info='"+this.info+"' />");
		return output;
	}
}