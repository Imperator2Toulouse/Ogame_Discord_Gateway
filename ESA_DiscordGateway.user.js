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

var xhr;
try {  xhr = new ActiveXObject('Msxml2.XMLHTTP');   }
catch (e) 
{
    try {   xhr = new ActiveXObject('Microsoft.XMLHTTP'); }
    catch (e2) 
    {
        try {  xhr = new XMLHttpRequest();  }
        catch (e3) {  xhr = false;   }
    }
}

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
function check_attack() {
	if ($("div#attack_alert").length > 0){
        xhr.onreadystatechange  = function()
        {
            if(xhr.readyState  == 4)
            {
                if(xhr.status  == 200) {
                    if (xhr.responseText.match("Flotte ennemie")) {
						//if (xhr.responseText.match("allianceAttack").length >0)
						//	Attaque_groupee=true
						
                        //events = xhr.responseText.split('eventFleet');
						events = xhr.responseText.split('<tr class="');
                        for (i=1 ; i<events.length ; i++) {
                            if (events[i].match('Flotte ennemie') && !events[i].match("https://gf3.geo.gfsrv.net/cdnb7/60a018ae3104b4c7e5af8b2bde5aee.gif") && !events[i].match("https://gf3.geo.gfsrv.net/cdne8/583cd7016e56770a23028cba6b5d2c.gif")) {
								//Imp2Toulouse- Compatibility with antigame
                                isOnLune=events[i].split(/<td class="destFleet">/)[1].split(/<\/td>/)[0].match("moon");

                                coords = '['+events[i].split('destCoords')[1].split('[')[1].split(']')[0]+']';
                                if (isOnLune) coords += 'Lune';
                                time_attack = parseInt(events[i].split('data-arrival-time="')[1].split('"')[0]) - Math.floor(time()/1000);

								if (events[i].match('data-mission-type="1"'))
									time_arrival= events[i].split('arrivalTime">')[1].split('</td>')[0].trim();
								else
									time_arrival= events[i].match('data-arrival-time="(.*)"')[1].trim();
								
                                cp_attacked = events[i].split('destFleet')[1].split('figure>')[1].split('</td>')[0].trim();
								planet_origin = events[i].split('originFleet">')[1].split('</td>')[0].split('</figure>')[1].trim();
								coords_origin = '['+events[i].split('coordsOrigin')[1].split('[')[1].split(']')[0]+']';
								total_fleets_origin = events[i].split('detailsFleet">')[1].split('<span>')[1].split('</span>')[0].trim();
								liste_fleets_origin = events[i].split('icon_movement">')[1].split('Vaisseaux:')[1].split('&lt;/table&gt;')[0].replace(/(<(?:.|\n)*?>)/gm, ' ').replace(/(&lt;(?:.|\n)*?&gt;)/gm, ' ').replace(/\s+/gm, ' ');
                                attaker_playerid=parseInt(events[i].match(/data-playerId="(\d+)"/)[1]);
								
								if (readCookie('webhook_advert_'+cp_attacked,'all') == null)
									setTimeout(send_to_webhook(cp_attacked,coords,isOnLune,time_attack,time_arrival,planet_origin,coords_origin, total_fleets_origin, liste_fleets_origin),2000);
                            }
                        }
                    }
				}
            }
        };

        xhr.open("POST", "https://"+univers+"/game/index.php?page=eventList",  true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send();
    }
	setTimeout(check_attack, rand(4,6)*1000);
}

function send_to_webhook(cp_attacked,coords,isOnLune,time_attack,time_arrival,planet_origin,coords_origin, total_fleets_origin,liste_fleets_origin) {
    createCookie('webhook_advert_'+cp_attacked, time(), 1, 'all');	
	message="|_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_|\nAttaque en cours sur la "+((isOnLune)?"lune":"planete")+" "+cp_attacked+" "+coords+"\n\tNom du défenseur : "+username+"\n\tHeure d'impact : "+time_arrival+"\n\tInformation attaquant:\n\t\tAttaque depuis: "+planet_origin+" "+coords_origin+"\n\t\tNombres vaisseaux: "+total_fleets_origin+"\n\t\tListe vaisseaux: "+liste_fleets_origin+"\n|_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_|\n";

	var params = JSON.stringify({ "username": "I2T", "content":message });

	xhr.open("POST", URL_WEBHOOK+																																																																																																																																																																																																																																																																																																																																													"?wait=1",  true);
    xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
    xhr.send(params);
}

//get username
username=($('span.textBeefy a.overlay.textBeefy').length > 0)?$('span.textBeefy a.overlay.textBeefy').html().replace(/ /g,'').replace("\n",''):"unloged";
cur_planet=$("#selectedPlanetName").html().trim();

//Launch
setTimeout(check_attack, 2000);