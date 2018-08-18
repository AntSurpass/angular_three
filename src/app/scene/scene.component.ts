import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import "./js/ThreeExamples.js";
import * as THREE from "three";

import "three/examples/js/controls/OrbitControls";
import "three/examples/js/loaders/OBJLoader";


@Component({
  selector: 'scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.css']
})
export class SceneComponent implements AfterViewInit {

  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private cameraTarget: THREE.Vector3;
  public scene: THREE.Scene;

  public controls: THREE.OrbitControls;

  public fieldOfView: number = 60;
  public nearClippingPane: number = 1;
  public farClippingPane: number = 1100;

  private modelArr: any[];


  @ViewChild('canvas')
  private canvasRef: ElementRef;

  constructor() {
    this.render = this.render.bind(this);
    this.onModelLoadingCompleted = this.onModelLoadingCompleted.bind(this);
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private createScene() {
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AxesHelper(200));
  }
  private createModel() {
    var loader = new THREE.OBJLoader();
    loader.load('assets/model/c01.OBJ', this.onModelLoadingCompleted);
  }
  private onModelLoadingCompleted(loadeMesh) {

    var objMaterial = new THREE.MeshStandardMaterial();
    var texture = new THREE.TextureLoader().load("assets/pic/wood-floor.jpg");
    objMaterial.map = texture;

    loadeMesh.scale.set(10, 10, 10);
    loadeMesh.position.set(30, 0, 30);
    loadeMesh.name = "tab";

    // loadeMesh.add(new THREE.AxesHelper(200));
    loadeMesh.castShadow = true;
    loadeMesh.clone();
    // this.modelArr.push(loadeMesh.children[0]);
    this.scene.add(loadeMesh);
    //    地板
    var planeGeometry = new THREE.PlaneGeometry(this.canvas.clientWidth, this.canvas.clientHeight);
    // var planeGeometry = new THREE.PlaneGeometry(this.canvas.clientWidth / 2, this.canvas.clientHeight / 2);
    var planeMaterial = new THREE.MeshStandardMaterial();
    planeMaterial.side = THREE.DoubleSide;
    var texture = new THREE.TextureLoader().load("assets/pic/wood-floor.jpg");
    texture.repeat.set(8, 8);
    texture.wrapS = THREE.RepeatWrapping; // X轴 行为 重复自己
    texture.wrapT = THREE.RepeatWrapping; // y轴 行为 重复自己

    planeMaterial.map = texture;
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    //告诉底部平面需要接收阴影
    plane.receiveShadow = true;
    this.scene.add(plane);

    this.render();
  }

  private createLight() {
    this.scene.add(new THREE.AmbientLight(0x404040)); // 平行光
    var light = new THREE.DirectionalLight(0xffffff); // 环境光
    light.position.set(100, 100, 1);
    light.castShadow = true; // 设置阴影
    this.scene.add(light);
  }

  private createCamera() {
    let aspectRatio = this.getAspectRatio();
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      aspectRatio,
      this.nearClippingPane,
      this.farClippingPane
    );
    this.camera.position.set(0, 100, 400);
  }

  private getAspectRatio(): number {
    let height = this.canvas.clientHeight;
    if (height === 0) {
      return 0;
    }
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  private startRendering() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0xffffff, 1);
    this.renderer.autoClear = true;

    let component: SceneComponent = this;

    (function render() {
      requestAnimationFrame(render);
      component.render();
    }());
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public addControls() {
    this.controls = new THREE.OrbitControls(this.camera);
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.addEventListener('change', this.render);
    // this.controls.addEventListener('start', () => {});
    // this.controls.addEventListener('end', () => {});s
  }


  /* EVENTS */

  public onMouseDown(event: MouseEvent) {
    // event.preventDefault();

    // Example of mesh selection/pick:
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, this.camera);

    var obj: THREE.Object3D[] = [];
    this.findAllObjects(obj, this.scene);
    var intersects = raycaster.intersectObjects(obj);
    // console.log(this.scene.children);
    // console.log(this.scene);
    if (intersects.length > 0 && intersects[0].object.parent.name === "tab") {
      var selectObj: any = intersects[0].object.clone();
      selectObj.material.color.set(0xff0000);
      // console.log(intersects[0].object.parent.name);
      // console.log(intersects[0].object);
    }
  }

  private findAllObjects(pred: THREE.Object3D[], parent: THREE.Object3D) {
    // NOTE: Better to keep separate array of selected objects
    if (parent.children.length > 0) {
      parent.children.forEach((i) => {
        pred.push(i);
        this.findAllObjects(pred, i);
      });
    }
  }

  public onMouseUp(event: MouseEvent) {
    console.log("onMouseUp");
  }


  @HostListener('window:resize', ['$event'])
  public onResize(event: Event) {
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    console.log("onResize: " + this.canvas.clientWidth + ", " + this.canvas.clientHeight);

    this.camera.aspect = this.getAspectRatio();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.render();
  }

  @HostListener('document:keypress', ['$event'])
  public onKeyPress(event: KeyboardEvent) {
    console.log("onKeyPress: " + event.key);
  }

  /* LIFECYCLE */
  ngAfterViewInit() {
    this.createScene();
    this.createLight();
    this.createModel();
    this.createCamera();
    this.startRendering();
    this.addControls();
  }


}
