// All of these functions are in the global scope
		
"use strict";

function playerIntersect(player, objective){
	var dx = objective.x - player.x;
	var dy = objective.y - player.y;
	var distance = Math.sqrt(dx*dx + dy*dy);
	return distance < player.radius + objective.radius;
}

function getRandom(min, max) {
  	return Math.random() * (max - min) + min;
}

function clamp(val, min, max){
	return Math.max(min, Math.min(max, val));
}


