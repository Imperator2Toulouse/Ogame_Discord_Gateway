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


//Configuration
var URL_WEBHOOK="";

//Declarations
var univers = window.location.hostname;
var username;
var cur_planet;

//Fonctions
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

function process_event_list(content)
{
    var p = new DOMParser();
    var doc = p.parseFromString(content, "text/html");

    var event_fleet_tags = doc.getElementsByClassName("eventFleet");

    for (var i = 0; i < event_fleet_tags.length; ++i)
    {
        var event_fleet_tag = event_fleet_tags[i];

        var mission_fleet_tag = event_fleet_tag.getElementsByClassName("missionFleet")[0];
        var arrival_time_tag = event_fleet_tag.getElementsByClassName("arrivalTime")[0];
        var origin_fleet_tag = event_fleet_tag.getElementsByClassName("originFleet")[0];
        var coords_origin_tag = event_fleet_tag.getElementsByClassName("coordsOrigin")[0];
        var details_fleet_tag = event_fleet_tag.getElementsByClassName("detailsFleet")[0];
        var icon_movement_tag = event_fleet_tag.getElementsByClassName("icon_movement")[0];
        var dest_fleet_tag = event_fleet_tag.getElementsByClassName("destFleet")[0];
        var dest_coords_tag = event_fleet_tag.getElementsByClassName("destCoords")[0];
        
        var img_mission_fleet_tag = mission_fleet_tag.getElementsByTagName("img")[0];
        var figure_origin_fleet_tag = origin_fleet_tag.getElementsByTagName("figure")[0];
        var figure_dest_fleet_tag = dest_fleet_tag.getElementsByTagName("figure")[0];

        var event = {};
        event.id = event_fleet_tag.id.split("-")[1];
        event.time = arrival_time_tag.textContent;
        event.type = img_mission_fleet_tag.getAttribute("title");
        event.source_name = origin_fleet_tag.textContent;
        event.source_type = figure_origin_fleet_tag.classList.item(1);
        event.source_coordinates = coords_origin_tag.textContent;
        event.fleet_size = details_fleet_tag.textContent;
        event.fleet_details = ""; // TODO : parse and beautify fleet details
        event.target_name = dest_fleet_tag.textContent;
        event.target_type = figure_dest_fleet_tag.classList.item(1);
        event.target_coordinates = dest_coords_tag.textContent;


        if (event.type.split("|")[0] == "Flotte ennemie")
        {
            send_to_webhook(event);
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

function send_to_webhook(event) {
    createCookie('webhook_advert_' + event.id, time(), 1, 'all');	
	var message = "|_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_|\n";
    message += "Attaque en cours sur la [target_type] [target_name] [target_coordinates]\n";
    message += "\tNom du défenseur : [target_username]\n";
    message += "\tHeure d'impact : [impact_date]\n";
    message += "\tInformation attaquant:\n";
    message += "\t\tAttaque depuis: [source_name] [source_coordinates]\n";
    message += "\t\tNombres vaisseaux: [source_fleet]\n";
    message += "\t\tListe vaisseaux: [source_fleet_details]\n";
    message += "|_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_|\n";
    
    message = message.replace("[target_type]", event.target_type);
    message = message.replace("[target_name]", event.target_name);
    message = message.replace("[target_coordinates]", event.target_coordinates);
    message = message.replace("[target_username]", username);
    message = message.replace("[impact_date]", event.time);
    message = message.replace("[source_name]", event.source_name);
    message = message.replace("[source_coordinates]", event.source_coordinates);
    message = message.replace("[source_fleet]", event.fleet_size);
    message = message.replace("[source_fleet_details]", event.fleet_details);

	var params = JSON.stringify({ "username" : "I2T", "content" : message});

    var xhr = new XMLHttpRequest();
	xhr.open("POST", URL_WEBHOOK + "?wait=1");
    xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhr.send(params);
}

//get username
username=($('span.textBeefy a.overlay.textBeefy').length > 0)?$('span.textBeefy a.overlay.textBeefy').html().replace(/ /g,'').replace("\n",''):"unloged";
cur_planet=$("#selectedPlanetName").html().trim();

//Launch
setTimeout(check_attack, 2000);