#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

// random-Funktion zur Gernerierung eines Zufallswert in GLSL
float random(vec2 st){
    return fract(sin(dot(st.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// noise-Funktion
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Vier Ecken im 2D ganzzahligen Raum
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Interpolieren
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

// Funktion zum Generieren von Sternen mithilfe der random-Funktion
float generateStars(vec2 coordinates) {
        float starValue = random(coordinates * 100.0);
        return starValue > 0.98 ? 1.0 : 0.0;
}

// Funktion zur Kollisionserkennung
bool isCollision(vec2 pos1, vec2 pos2, float radius1, float radius2){
    if (distance(pos1, pos2) <= radius1 + radius2){
        return true;
    }
    return false;
}

// Zeichnung eines runden Objekts im Universum (Planet, PacMan, Sonne, Stern)
vec3 drawObject(vec2 st, vec2 position, float radius, vec3 objectColor, vec3 backgroundColor) {
    if (distance(st, position) < radius) {
        return objectColor; // Objektfarbe zurückgeben, wenn der Punkt innerhalb des Radius liegt
    } else {
        return backgroundColor; // Ansonsten Hintergrundfarbe beibehalten
    }
}


// Funktion zur Zeichnung eines runden Orbits
vec3 drawOrbit(vec2 Coordinate, vec2 center, float orbitRadius, float lineWidth, vec3 color, vec3 backgroundColor) {
    if (abs(distance(Coordinate, center) - orbitRadius) < lineWidth) {
        return color; 
    }
    return backgroundColor;
}

// Funktion zur Bestimmung des Mittelpunkts eines Planeten auf der Ellipsenlaufbahn
vec2 getEllipsePosition(float u_time, float majorAxis, float minorAxis, vec2 center, float speed) {
  float angle = u_time * speed;
  float x = center.x + majorAxis * cos(angle);
  float y = center.y + minorAxis * sin(angle);
  return vec2(x, y);
}

// Funktion zur Bestimmung des Mittelpunkts eines Planeten auf der Kreislaufbahn
vec2 getCirclePosition(float u_time, float orbitRadius, vec2 center, float speed){
     float angle2 = u_time * speed;
     return center + vec2(cos(angle2), sin(angle2)) * orbitRadius;
}

// Funktion zur Bestimmung des Kometen, der am Rand abprallt
vec2 getCometPosition(float u_time, float cometSpeedX, float cometSpeedY, float cometRadius) {
    // Modifizierte Zeitvariable für X- und Y-Bewegung
    float modifiedTimeX = mod(u_time * cometSpeedX, 2.0 - 2.0 * cometRadius);
    float modifiedTimeY = mod(u_time * cometSpeedY, 2.0 - 2.0 * cometRadius);

    // Berechnung der Kometenposition mit korrigierter Randabpralllogik
    vec2 cometPath;
    cometPath.x = modifiedTimeX > 1.0 - cometRadius ? 2.0 * (1.0 - cometRadius) - modifiedTimeX : modifiedTimeX;
    cometPath.y = modifiedTimeY > 1.0 - cometRadius ? 2.0 * (1.0 - cometRadius) - modifiedTimeY : modifiedTimeY;

    // Anpassen der Kometenposition für Randberücksichtigung
    cometPath = cometPath * (1.0 - cometRadius) + cometRadius;

    return cometPath;
}

// Funktion zur Darstellung der Supernova, mithilfe der mix und smoothstep-Funktion
vec3 drawSupernova(vec2 st, vec2 center, float time, float period, float duration, float maxSize, float normalSize) {
    float distanceToCenter = distance(st, center);
    float cycleTime = mod(time, period);
    bool isSupernova = cycleTime < duration;
    float progress = min(cycleTime / duration, 1.0);
    float currentSize = isSupernova ? (maxSize * progress) : normalSize;
    float glowStrength = isSupernova ? (1.0 - progress) : smoothstep(normalSize, normalSize + 0.05, distanceToCenter);

    if (distanceToCenter < currentSize) {
        vec3 color = isSupernova ? vec3(1.0, 0.5, 0.0) : vec3(1.000, 0.841, 0.092);
        return mix(color, vec3(0.0), glowStrength);
    }
    return vec3(0.0);
}

vec3 applyBlackHoleEffect(vec2 st, vec2 blackHolePosition, float blackHoleRadius, vec3 color) {
    float distanceToBlackHole = distance(st, blackHolePosition);
    float effectRadius = blackHoleRadius * 2.0; // Effektradius doppelt so groß wie der Radius des Schwarzen Lochs

    if (distanceToBlackHole < effectRadius) {
        float effectStrength = smoothstep(effectRadius, blackHoleRadius, distanceToBlackHole);
        color = mix(color, vec3(0.0), effectStrength);
    }

    return color;
}


void main() {
    // Normierung in 2D-Koordinatensystem mit (x= 0.0 - 1.0, y= 0.0-1.0)
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
   	st.x *= u_resolution.x / u_resolution.y;
    
    //---------  Sonnen-Parameter --------
    // Zentrum der Sonne
    vec2 center = vec2(0.5, 0.5);
    // Berechnung des Abstands vom Zentrum
    float dist = distance(st, center);
    // Sonnenradius
    float sunRadius = 0.1;

    // ------ Variablen festlegen: Geschwindigkeiten, Radien, Farben etc. --------------------------------
    // Radien der Kreisumlaufbahn
    float circleOrbitRadius1 = sunRadius + 0.1;
    float circleOrbitRadius2 = sunRadius + 0.3;
    // Dicke der Laufbahnlinien (Orbit)
    float orbitWidth = 0.002;
    float ellipseOrbitWidth = 0.009; // Breite der Umlaufbahnlinie

    // Parameter für die elliptische Umlaufbahn
    float majorAxis = 0.45; // Länge der großen Halbachse (Hauptachse)
    float minorAxis = 0.25; // Länge der kleinen Halbachse (Nebenachse)

    // ----- Planeten ------
    // Radius und Geschwindigkeit der Planeten
    float planetRadius1 = 0.02;
    float planetRadius2 = 0.04;
    float planetRadius3 = 0.03;
    float speedPlanet1 = 0.6;
    float speedPlanet2 = 0.3;
    float speedPlanet3 = 0.2;

    // Positionsberechnung für die Planeten durch Funktionsaufrufe
    vec2 planetPosition1 = getCirclePosition(u_time, circleOrbitRadius1, center, 0.6);
    vec2 planetPosition2 = getCirclePosition(u_time, circleOrbitRadius2, center, 0.6);
    vec2 planetPosition3 = getEllipsePosition(u_time, 0.45, 0.25, center, speedPlanet3);
       
    // Mond um den dritten Planeten
 	float moonOrbitRadius = 0.05; // Der Radius der Mondumlaufbahn um den Planeten
	float moonSpeed = 1.5; // Die Umlaufgeschwindigkeit des Mondes um den Planeten
    float moonRadius = 0.015;
    
    // Positionsberechnung durch Aufruf der Funktion (bewegt sich um Mittelpunkt von Planet 3)
	vec2 moonPosition = getCirclePosition(u_time, moonOrbitRadius, planetPosition3, moonSpeed);
    
    // Komet-Parameter
   	float cometRadius = 0.03;
   	float cometSpeedX = 4.0 / 15.0;
    float cometSpeedY = 7.0 / 25.0;

    vec3 kometInnerColor = vec3(1.000,0.0,0.0); // Innere Farbe des Feuerballs, mehr Rot
    vec3 kometOuterColor = vec3(1.000,0.360,0.029); // Äußere Farbe des Feuerballs, mehr Rot und dunkler

    
    // Kometposition durch Funktionsaufruf
    vec2 cometPosition = getCometPosition(u_time, cometSpeedX, cometSpeedY,  cometRadius);

    // Pacman-Parameter: Normierung der Maus auf den Bildbereich
    float pacmanRadius = 0.04;
    vec2 pacmanPosition = u_mouse / u_resolution;
   	pacmanPosition.x *= u_resolution.x / u_resolution.y;

    // Supernova-Parameter
    // Zentrum des Supernova-Sterns
    vec2 supernovaCenter = vec2(0.1, 0.2);

    float supernovaPeriod = 7.0; // Wiederholungsperiode der Supernova
    float supernovaDuration = 2.0; // Dauer der Supernova
    float supernovaMaxSize = 0.2; // Maximale Größe der Supernova
    float normalStarSize = 0.02; // Größe des Sterns außerhalb der Supernova

    // schwarze Löcher-Parameter
    vec2 blackHolePosition = vec2(0.220,0.400);
    float blackHoleRadius = 0.05;

    vec2 blackHolePosition2 = vec2(0.2, 0.85);
    float blackHoleRadius2 = 0.04;

    vec2 blackHolePosition3 = vec2(0.9, 0.1);
    float blackHoleRadius3 = 0.1;
    
    
    
    // Hintergrund zeichnen: Sterne, Hintergrund und Nebel
    // Hintergrund schwarz
    vec3 color = vec3(0.0); // Schwarz als Hintergrund
    
    // Nebelhintergrund mit noise
    float n = noise(st * 15.0 + u_time);
    color += vec3(n) * vec3(0.1, 0.1, 0.2); 
    
    // Sternenhintergrund durch zufällige gelbe Punkte
    float stars = generateStars(st);
    color += vec3(stars) * vec3(0.500,0.465,0.033); 

    
    
   
    // ------- Umlaufbahnen zeichnen ------
    // Kreisumlaufbahnen Planet1 und Planet2
    color = drawOrbit(st, vec2(0.5, 0.5), circleOrbitRadius1, orbitWidth, vec3(1.0, 1.0, 1.0), color);
    color = drawOrbit(st, vec2(0.5, 0.5), circleOrbitRadius2, orbitWidth, vec3(1.0, 1.0, 1.0), color);
    // Ellipsenumlaufbahn Planet 3
    vec2 normalizedPos = (st - center) / vec2(majorAxis, minorAxis);
    float ellipseEquation = (normalizedPos.x * normalizedPos.x) + (normalizedPos.y * normalizedPos.y);
    if (abs(ellipseEquation - 1.0) < ellipseOrbitWidth) {
        color = mix(color, vec3(1.0), smoothstep(ellipseOrbitWidth, ellipseOrbitWidth - 0.001, abs(ellipseEquation - 1.0)));
    }
   
    // ----- Zeichnen der Planeten ------
    // Zeichnen der Planeten 1 und 2
    color =  drawObject(st, planetPosition1, planetRadius1, vec3(0.0, 0.0, 5.0), color);
    color =  drawObject(st, planetPosition2, planetRadius2, vec3(0.0, 5.0, 5.0), color);    
    // Zeichnung des Planeten 3
    color = drawObject(st, planetPosition3, planetRadius3, vec3(0.5, 0.8, 0.2), color);
    
    // Zeichnung des Mondes um Planet 3
    color = drawObject(st, moonPosition, moonRadius, vec3(0.5, 0.1, 0.1), color);

// ---- freier Komet mir Randabprallern -----

    color = drawObject(st, cometPosition, cometRadius, vec3(1.0, 0.0, 0.0), color);
    

// ------ Pacman ------    
     // Zeichne Pacman mit rotierendem Maul
    float distPAC = distance(st, pacmanPosition);
    if (distPAC < pacmanRadius) {
        // Berechne Winkel relativ zur Pacman-Position
        float angle = atan(st.y - pacmanPosition.y, st.x - pacmanPosition.x);
    	// Normalisiere den Winkel zwischen 0 und 2*PI
        if (angle < 0.0) angle += 6.28318530718;
    	// Rotierender Maulbereich
        float rotationSpeed = 1.0; // Geschwindigkeit der Maulrotation
        float startAngle = mod(u_time * rotationSpeed, 6.28318530718);
        float endAngle = startAngle + radians(90.0); // 90 Grad Maulöffnung
        
        // Überprüfe, ob Pixel im Maulbereich liegt
        if (!(angle > startAngle && angle < endAngle)) {
            color = vec3(1.0, 1.0, 0.0); // gelber Pacman
        }
    }


  
    
    
// ------Supernova------
     // Zentrum des Supernova-Sterns (unten links)
    color += drawSupernova(st, supernovaCenter, u_time, supernovaPeriod, supernovaDuration, supernovaMaxSize, normalStarSize);


    // Zeichne des Kerns der Sonne
    color = drawObject(st, center, sunRadius, vec3(1.0, 1.0, 0.0), color);
    // Sonne mit Glühen
    float distToSun = distance(st, center);
    float glowStrength = smoothstep(sunRadius, sunRadius + 0.05, distToSun);
    color += mix(vec3(1.0, 0.5, 0.0), vec3(0.0), glowStrength);
    // Anwenden des Schwarzen Loch-Effekts
    color = applyBlackHoleEffect(st, blackHolePosition, blackHoleRadius, color);
    color = applyBlackHoleEffect(st, blackHolePosition2, blackHoleRadius2, color);
    color = applyBlackHoleEffect(st, blackHolePosition3, blackHoleRadius3, color);
    
    gl_FragColor = vec4(color, 1.0);
    
    
}