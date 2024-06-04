import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as THREE from "three";

export class My3DViewerControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _renderer: THREE.WebGLRenderer;
    private _scene: THREE.Scene;
    private _camera: THREE.PerspectiveCamera;
    private _cube: THREE.Mesh;
    private _raycaster: THREE.Raycaster;
    private _mouse: THREE.Vector2;
    private _intersected: THREE.Object3D | null = null;

    constructor() {
        // no-op
    }

    public init(
        context: ComponentFramework.Context<IInputs>, 
        notifyOutputChanged: () => void, 
        state: ComponentFramework.Dictionary, 
        container: HTMLDivElement
    ): void {
        this._container = container;

        // Track window size
        context.mode.trackContainerResize(true);
        
        //this._container.style.backgroundColor = "red";
        //this._container.style.width = "100%";
        //this._container.style.height = "100%";
        //this._container.style.position = "relative";

        // Initialize Three.js renderer
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        //this._renderer.setSize(container.clientWidth, container.clientHeight);
        //this._renderer.setSize(context.mode.allocatedHeight, context.mode.allocatedHeight);
        this._renderer.setClearColor(0xffffff); // Set background color to white
        this._renderer.shadowMap.enabled = true; // Enable shadow maps
        container.appendChild(this._renderer.domElement);

        

        // Create a scene
        this._scene = new THREE.Scene();

        // Add a camera
        this._camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);

        this._camera.position.z = 2;

        // Create a cube
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Use MeshStandardMaterial for better lighting
        this._cube = new THREE.Mesh(geometry, material);
        this._cube.castShadow = true; // Enable casting shadows
        this._scene.add(this._cube);

        // Create a plane to receive the shadow
        const planeGeometry = new THREE.PlaneGeometry(500, 500);
        const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -1;
        plane.receiveShadow = true; // Enable receiving shadows
        this._scene.add(plane);

        // Add a directional light
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        light.castShadow = true; // Enable shadow casting by the light
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        this._scene.add(light);

        // Initialize raycaster and mouse vector
        this._raycaster = new THREE.Raycaster();
        this._mouse = new THREE.Vector2();

        // Add event listener for mouse click
        container.addEventListener('click', this.onMouseClick.bind(this), false);

        // Render the scene
        const animate = () => {
            requestAnimationFrame(animate);
            this._cube.rotation.x += 0.01;
            this._cube.rotation.y += 0.01;
            this._renderer.render(this._scene, this._camera);
        };
        animate();
    }

    private onMouseClick(event: MouseEvent): void {
        // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
        const rect = this._container.getBoundingClientRect();
        this._mouse.x = ((event.clientX - rect.left) / this._container.clientWidth) * 2 - 1;
        this._mouse.y = -((event.clientY - rect.top) / this._container.clientHeight) * 2 + 1;

        // Update the raycaster with the mouse position and the camera
        this._raycaster.setFromCamera(this._mouse, this._camera);

        // Calculate objects intersected by the raycaster
        const intersects = this._raycaster.intersectObjects(this._scene.children);

        if (intersects.length > 0) {
            // Check if the intersected object is the cube
            if (intersects[0].object === this._cube) {
                const material = this._cube.material;
                if (Array.isArray(material)) {
                    material.forEach((mat) => {
                        if (mat instanceof THREE.MeshStandardMaterial) {
                            mat.color.setHex(Math.random() * 0xffffff); // Change color on click
                        }
                    });
                } else if (material instanceof THREE.MeshStandardMaterial) {
                    material.color.setHex(Math.random() * 0xffffff); // Change color on click
                }
            }
        }
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const width = context.mode.allocatedWidth;
        const height = context.mode.allocatedHeight;

        this._renderer.setSize(width, height);
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();

        //this._container.style.overflow = "hidden";
        //this._container.style.height = `${height}px`;
        //this._container.style.width = `${width}px`;
        //this._container.innerText = "DEMO TEXT";
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {
        // Cleanup
        this._renderer.dispose();
    }
}
