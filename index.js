import * as THREE from "three"
import { OrbitControls } from 'OrbitControls'; // importation de l'addon Orbit Controls pour la gestion de la caméra
import { TrackballControls } from 'TrackballControls'; // importation de l'addon Orbit Controls pour la gestion de la caméra

// récupération des paramètres dans l'URL
const urlParams = new URLSearchParams(window.location.search)
let URL_X = urlParams.get("x")
let URL_Y = urlParams.get("y")
let URL_Z = urlParams.get("z")
let URL_MAX_ITER = urlParams.get("iter")
let URL_WIREFRAME = urlParams.get("wireframe")
let URL_PROBA = urlParams.get("probability")
let URL_SHAPE = urlParams.get("shape")

// Valeurs par défaut si aucun paramètre n'est entré dans l'URL
if (URL_X == null) URL_X = 2
if (URL_Y == null) URL_Y = 2
if (URL_Z == null) URL_Z = 2
if (URL_MAX_ITER == null) URL_MAX_ITER = 5
if (URL_WIREFRAME == null || URL_WIREFRAME != "on") URL_WIREFRAME = false
else URL_WIREFRAME = true
if (URL_PROBA == null) URL_PROBA = 1
else URL_PROBA = parseFloat(URL_PROBA)
if (URL_SHAPE == null) URL_SHAPE == "cube"

// fonction qui retourne la position dans la scène des sommets d'un mesh donné. 
const getGlobalVerticesPositions = (mesh) => {
    const positions = mesh.geometry.attributes.position.array; // on obtiens les positions locales des sommets du mesh. (dans son propre repère)
    const positionsArray = [];  // 
  
    const position = mesh.position.clone(); // Copie la position du mesh
    const scale = mesh.scale.clone(); // Copie la mise à l'échelle du mesh
  
    for (let i = 0; i < positions.length; i += 3) { // on défile dans les valeurs. on augemente de 3 à chaque boucle car les coordonnées sont stockées comme suit : x, y, z, x, y, z, x, y, z dans le tableau
      const x = positions[i] * scale.x + position.x;
      const y = positions[i + 1] * scale.y + position.y;
      const z = positions[i + 2] * scale.z + position.z;
      positionsArray.push({x: x, y: y, z: z}); // on ajoute les coordonnées rangées dans un objet comme ça {x:x, y:y, z:z} pour chaque sommet
    }
  
    var uniquePositions = positionsArray.reduce((acc, pos) => {
        if (!acc.some(p => p.x === pos.x && p.y === pos.y && p.z === pos.z)) { // on filtre parce que certaines coordonnées peuvent être en plusieurs fois
            acc.push(pos);
        }
        return acc;
    }, []);
    
    return uniquePositions // on return le tableau avec les coordonnées de chaque sommet du mesh
}

// fonction qui permet de dessiner un mesh à une position donnée
const drawCubeAtPosition = (position, iter) => { // Ajout de 'iter' comme argument
  if (iter > URL_MAX_ITER) { // condition d'arrêt au cas où on atteint le nombre d'itération maximales définies.
    return;
  }

  const nb = Math.floor(Math.random()*(URL_PROBA+(iter/10))) // tire un nombre entre 0 et un nombre donné dans les paramètres avant. arrondi à l'unité inférieure
  if (nb == 0 || iter == 1) { // si le nombre tiré est = à 0 ou si on est à la première itération (pour éviter d'avoir un rendu vide)
    const cube = new THREE.Mesh(geometry, material) // on définit un nouveau mesh
    cube.castShadow = true; // il pourra générer des ombres
    cube.receiveShadow = true // il pourra recevoir des ombres
    cube.position.set(position.x, position.y, position.z) // il sera à la position donnée en paramètres
    cube.scale.set( // rétrécissement du mesh par rapport à chaque itération de manière à ce qu'il soient de plus en plus petits
      1/Math.pow(URL_X, iter), 
      1/Math.pow(URL_Y, iter), 
      1/Math.pow(URL_Z, iter)
    );
    scene.add(cube) // on ajoute le mesh à la scene 3D
    const verticesPositions = getGlobalVerticesPositions(cube) // on appelle la fonction qui récupère les coordonnées des sommets du mesh
    verticesPositions.forEach((position) => { // pour chaque sommet
      drawCubeAtPosition(position, iter + 1); // Appel récursif avec iter décrémenté
    })
  }
}

let geometry
let materialProperties

if (URL_SHAPE == "cube") geometry = new THREE.BoxGeometry() // choix du type de mesh utilisé en fonction du paramètre rentré
else if (URL_SHAPE == "tetrahedron") geometry = new THREE.TetrahedronGeometry()
else if (URL_SHAPE == "dodecahedron") geometry = new THREE.DodecahedronGeometry()
else if (URL_SHAPE == "isocahedron") geometry = new THREE.IcosahedronGeometry()
else if (URL_SHAPE == "octahedron") geometry = new THREE.OctahedronGeometry()
else geometry = new THREE.BoxGeometry()

if (URL_WIREFRAME) { // choix des paramètres du matériau (wireframes ou pas)
  materialProperties = {
    color: 0xffffff, transparent: true, wireframe:true
  }
} else {
  materialProperties = {
    color: 0xffffff
  }
}
const material = new THREE.MeshPhongMaterial(materialProperties)

// définition de la scene et de la caméra
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// lumières
scene.add(new THREE.AmbientLight(0xd2b48c, .5))

const point = new THREE.PointLight(0xff8888, 12)
point.position.set(0, 2, 0)
point.castShadow = true
camera.add(point)

const point2 = new THREE.PointLight(0x88ff88, 12)
point2.position.set(0, -2, 0)
point2.castShadow = true
camera.add(point2)

const point3 = new THREE.PointLight(0x8888ff, 12)
point3.position.set(2, 0, 0)
point3.castShadow = true
camera.add(point3)

const point4 = new THREE.PointLight(0xffff88, 12)
point4.position.set(-2, 0, 0)
point4.castShadow = true
camera.add(point4)

// premier appel de la fonction récursive
var iter = 1
drawCubeAtPosition({x:0, y:0, z:0}, iter)

// définition des contrôles de la caméra
const controls = new TrackballControls(camera, renderer.domElement);
scene.add(camera)

// boucle de rendu
function animate() {
	requestAnimationFrame( animate );
  controls.update()
	renderer.render( scene, camera );
}

animate();