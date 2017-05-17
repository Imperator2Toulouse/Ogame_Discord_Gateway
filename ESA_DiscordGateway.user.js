/*
// ==UserScript==
// @name        Discord Gateway
// @namespace   Discord_Gateway
// @version     1.0
// @description Script Ogame
// @author      I2T
// @include     /^(http|https)://s.*\.ogame\.gameforge\.com/game/.*$/
// @exclude     /^(http|https)://s.*\.ogame\.gameforge\.com/feed/.*$/
// @exclude     /^(http|https)://s.*\.ogame\.gameforge\.com/board/.*$/
// @exclude     /^(http|https)://www.*$/
// @exclude     /^(http|https)://.*ajax=1.*$/
// @copyright   2017+, You
// @require     http://code.jquery.com/jquery-1.9.1.min.js
// ==/UserScript==
*/

/* Configuration */
var URL_WEBHOOK="";


/* Declarations */
var univers = window.location.hostname;
var username;
var cur_planet;

/* Fonctions */
function rand(a,b) { return Math.floor((Math.random()*(b-a))+a);}

function time() {mytime=new Date();return mytime.getTime();}

function createCookie(name,value,days, pref) {
    if (pref == 'all') name = pref+'_'+name;
    else name = cur_planet+'_'+pref+'_'+name;
    localStorage.setItem(name,value);
}

function readCookie(name, pref) {
    if (pref == 'all') name = pref+'_'+name;
    else name = cur_planet+'_'+pref+'_'+name;
    return localStorage.getItem(name);
}

function eraseCookie(name, pref) {
    if (pref == 'all') name = pref+'_'+name;
    else name = cur_planet+'_'+pref+'_'+name;
    localStorage.removeItem(name);
}

function get_fleet_movement_id(movement_tag)
{
    if (movement_tag.hasAttribute("id"))
    {
        return movement_tag.id.split("-")[1];
    }
    else
    {
        for (var i = 0; i < movement_tag.classList.length; ++i)
        {
            var c = movement_tag.classList.item(i);
            if (c.indexOf("union") == 0)
            {
                return c.replace("union", "");
            }
        }
    }
}

function get_fleet_movement_time(movement_tag)
{
    var arrival_time_tag = movement_tag.getElementsByClassName("arrivalTime")[0];

    return arrival_time_tag.textContent.trim();
}

function get_fleet_movement_type(movement_tag)
{
    var mission_fleet_tag = movement_tag.getElementsByClassName("missionFleet")[0];
    var img_mission_fleet_tag = mission_fleet_tag.getElementsByTagName("img")[0];
    
    return img_mission_fleet_tag.getAttribute("title");
}

function get_fleet_movement_target_name(movement_tag)
{
    var dest_fleet_tag = movement_tag.getElementsByClassName("destFleet")[0];
    
    return dest_fleet_tag.textContent.trim();
}

function get_fleet_movement_target_type(movement_tag)
{
    var dest_fleet_tag = movement_tag.getElementsByClassName("destFleet")[0];
    var figure_dest_fleet_tag = dest_fleet_tag.getElementsByTagName("figure")[0];

    return figure_dest_fleet_tag.classList.item(1);
}

function get_fleet_movement_target_coordinates(movement_tag)
{
    var dest_coords_tag = movement_tag.getElementsByClassName("destCoords")[0];
    
    return dest_coords_tag.textContent.trim();
}

function is_movement_tag(movement_tag)
{
    return movement_tag.hasAttribute("id") || movement_tag.classList.contains("allianceAttack");
}

function is_fleet_tag(fleet_tag)
{
    return fleet_tag.hasAttribute("id") || fleet_tag.classList.contains("partnerInfo");
}

function get_fleet_movements(movement_tags)
{
    var fleet_movements = [];

    for (var i = 0; i < movement_tags.length; ++i)
    {
        var movement_tag = movement_tags[i];

        if (is_movement_tag(movement_tag))
        {
            var fleet_movement = {};
            fleet_movement.fleets = [];
            fleet_movement.id = get_fleet_movement_id(movement_tag);
            fleet_movement.time = get_fleet_movement_time(movement_tag);
            fleet_movement.type = get_fleet_movement_type(movement_tag);
            fleet_movement.target_name = get_fleet_movement_target_name(movement_tag);
            fleet_movement.target_type = get_fleet_movement_target_type(movement_tag);
            fleet_movement.target_coordinates = get_fleet_movement_target_coordinates(movement_tag);

            fleet_movements.push(fleet_movement);
        }
    }

    return fleet_movements;
}

function get_fleet_source_name(fleet_tag)
{
    var origin_fleet_tag = fleet_tag.getElementsByClassName("originFleet")[0];
    
    return origin_fleet_tag.textContent.trim();
}

function get_fleet_source_type(fleet_tag)
{
    var origin_fleet_tag = fleet_tag.getElementsByClassName("originFleet")[0];
    var figure_origin_fleet_tag = origin_fleet_tag.getElementsByTagName("figure")[0];
    
    return figure_origin_fleet_tag.classList.item(1);
}

function get_fleet_source_coordinates(fleet_tag)
{
    var coords_origin_tag = fleet_tag.getElementsByClassName("coordsOrigin")[0];
    
    return coords_origin_tag.textContent.trim();
}

function get_fleet_size(fleet_tag)
{
    var details_fleet_tag = fleet_tag.getElementsByClassName("detailsFleet")[0];
    
    return details_fleet_tag.textContent.trim();
}

function get_fleet_details(fleet_tag)
{
    return ($(fleet_tag).find("td.icon_movement span").length>0)?$($(fleet_tag).find("td.icon_movement span").attr('title')).find(".fleetinfo").html().replace(/<th.*>.*<\/th>/, '').replace(/(<(?:.|\n)*?>)/gm, ' ').replace(/\s+/gm, ' ').trim():"Aucun vaisseaux";
}

function get_fleets(fleet_tags)
{
    var fleets = [];

    for (var i = 0; i < fleet_tags.length; ++i)
    {
        var fleet_tag = fleet_tags[i];

        if (is_fleet_tag(fleet_tag))
        {
            var fleet = {};
            fleet.movement_id = get_fleet_movement_id(fleet_tag);
            fleet.source_name = get_fleet_source_name(fleet_tag);
            fleet.source_type = get_fleet_source_type(fleet_tag);
            fleet.source_coordinates = get_fleet_source_coordinates(fleet_tag);
            fleet.size = get_fleet_size(fleet_tag);
            fleet.details = get_fleet_details(fleet_tag);

            fleets.push(fleet);
        }
    }

    return fleets;
}

function merge_fleets_with_fleet_movements(fleet_movements, fleets)
{
    for (var i = 0; i < fleets.length; ++i)
    {
        for (var j = 0; j < fleet_movements.length; ++j)
        {
            if (fleets[i].movement_id == fleet_movements[j].id)
            {
                fleet_movements[j].fleets.push(fleets[i]);
                break;
            }
        }
    }
}

function get_movement_tags(event_fleet_tags, alliance_attack_tags)
{
    var movement_tags = [];

    for (var i = 0; i < event_fleet_tags.length; ++i)
    {
        movement_tags.push(event_fleet_tags[i]);
    }

    for (var i = 0; i < alliance_attack_tags.length; ++i)
    {
        movement_tags.push(alliance_attack_tags[i]);
    }

    return movement_tags;
}

function process_event_list(content)
{
    var p = new DOMParser();
    var doc = p.parseFromString(content, "text/html");

    var event_fleet_tags = doc.getElementsByClassName("eventFleet");
    var alliance_attack_tags = doc.getElementsByClassName("allianceAttack");

    var movement_tags = get_movement_tags(event_fleet_tags, alliance_attack_tags);

    var fleet_movements = get_fleet_movements(movement_tags);
    var fleets = get_fleets(event_fleet_tags);

    merge_fleets_with_fleet_movements(fleet_movements, fleets);

    for (var i = 0; i < fleet_movements.length; ++i)
    {
        var fleet_movement = fleet_movements[i];
 
        if (fleet_movement.type.split("|")[0] == "Flotte ennemie" || fleet_movement.type == "Attaque groupée")
        {
            send_to_webhook(fleet_movement);
        }
    }
}

function check_attack() {
	if ($("div#attack_alert").length > 0){
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange  = function()
        {
            if(this.readyState == XMLHttpRequest.DONE)
            {
                if(this.status  == 200)
                {
                    process_event_list(this.responseText);
				}
            }
        };

        xhr.open("GET", "https://" + univers + "/game/index.php?page=eventList");
        xhr.send();
    }
    
	setTimeout(check_attack, rand(4, 6) * 1000);
}

function send_to_webhook(fleet_movement) {
    createCookie('webhook_advert_' + fleet_movement.id, time(), 1, 'all');	
	var message = "|_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_|\n";
    message += "Attaque en cours sur [target_name] [target_coordinates] ([target_type])\n";
    message += "\tDéfenseur : [target_username]\n";
    message += "\tHeure d'impact : [impact_date]\n";
    message += "[fleets]";
    message += "|_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_|\n";
    
    var fleet_prototype = "\t\tAttaquant : [source_name] de [source_coordinates] ([source_type])\n";
    fleet_prototype += "\t\t\tVaisseaux ([size]) :\n";
    fleet_prototype += "\t\t\t[details]\n";

    var fleets = "";
    for (var i = 0; i < fleet_movement.fleets.length; ++i)
    {
        var f = fleet_movement.fleets[i];
        var p = fleet_prototype;
        p = p.replace("[source_name]", f.source_name);
        p = p.replace("[source_type]", f.source_type);
        p = p.replace("[source_coordinates]", f.source_coordinates);
        p = p.replace("[size]", f.size);
        p = p.replace("[details]", f.details);

        fleets += p;
    }

    message = message.replace("[target_type]", fleet_movement.target_type);
    message = message.replace("[target_name]", fleet_movement.target_name);
    message = message.replace("[target_coordinates]", fleet_movement.target_coordinates);
    message = message.replace("[target_username]", username);
    message = message.replace("[impact_date]", fleet_movement.time);
    message = message.replace("[fleets]", fleets);

	var params = JSON.stringify({ "username" : "I2T", "content" : message});

    var xhr = new XMLHttpRequest();
	xhr.open("POST", URL_WEBHOOK + "?wait=1");
    xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhr.send(params);
}

/* get username */
username=($('span.textBeefy a.overlay.textBeefy').length > 0)?$('span.textBeefy a.overlay.textBeefy').html().replace(/ /g,'').replace("\n",''):"unloged";
cur_planet=$("#selectedPlanetName").html().trim();

/* Launch */
setTimeout(check_attack, 2000);