import {Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener} from '@angular/core';

import * as THREE from "three";
import "./js/ThreeExamples.js";
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

  public fieldOfView: number = 60; // 相机视角宽度
  public nearClippingPane: number = 1; // 相机最小距离
  public farClippingPane: number = 10000; // 相机最大距离



  @ViewChild('canvas')
  private canvasRef: ElementRef;
  constructor() {
    this.render = this.render.bind(this);
    this.onModelLoadingCompleted = this.onModelLoadingCompleted.bind(this);
  }
  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }
  // 场景
  private createScene() {
    this.scene = new THREE.Scene();
    // this.scene.add(new THREE.AxesHelper(200));
  }
  // 光线
  private createLight() {
    this.scene.add(new THREE.AmbientLight(0x404040)); // 平行光
    var light = new THREE.DirectionalLight(0xffffff); // 环境光
    light.position.set(10, 10, 1);
    light.castShadow = true; // 设置阴影
    this.scene.add(light);
  }
  // 相机
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
  // 渲染器
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
  // 控制器
  public addControls() {
    this.controls = new THREE.OrbitControls(this.camera);
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.addEventListener('change', this.render);
    // this.controls.addEventListener('start', () => {});
    // this.controls.addEventListener('end', () => {});s
  }

  // 餐厅材质纹理
  private onLoaderMaterial(src) {
    let objMaterial = new THREE.MeshStandardMaterial();
    let texture = new THREE.TextureLoader().load(src);
    objMaterial.map = texture;
    return objMaterial;
  }
  // 餐厅模型
  public createModel() {
    var loader = new THREE.OBJLoader();
    loader.load('assets/model/FastFood.obj', this.onModelLoadingCompleted);
  }
  // 模型加载成功回调
  private onModelLoadingCompleted(loadeMesh) {
    // 餐厅
    let objM = this.onLoaderMaterial("assets/pic/FastFood.png");  // 加载材质纹理
    loadeMesh.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
          child.material = objM;
      }
  });
    // loadeMesh.children[0].material = objM;
    loadeMesh.scale.set(15, 15, 15);
    loadeMesh.position.set(0, 0, 0);
    loadeMesh.castShadow = true;
    this.scene.add(loadeMesh);
    //    地板
    var planeWidth = this.canvas.clientWidth > this.canvas.clientHeight ? this.canvas.clientHeight : planeWidth = this.canvas.clientHeight;
    var planeGeometry = new THREE.PlaneGeometry(this.canvas.clientWidth, this.canvas.clientWidth);
    var planeMaterial = new THREE.MeshStandardMaterial();
    planeMaterial.side = THREE.DoubleSide;
    var texture = new THREE.TextureLoader().load("assets/pic/wood-floor.jpg");
    texture.repeat.set(8, 8);
    texture.wrapS = THREE.RepeatWrapping; // X轴 行为 重复自己
    texture.wrapT = THREE.RepeatWrapping; // y轴 行为 重复自己
    planeMaterial.map = texture;
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.receiveShadow = true;    //告诉底部平面需要接收阴影
    this.scene.add(plane);
    this.render();
  }

  /* 事件 */
  public onMouseDown(event: MouseEvent) {

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, this.camera);

    var obj: THREE.Object3D[] = [];
    this.findAllObjects(obj, this.scene);
    var intersects = raycaster.intersectObjects(obj);
    if (intersects.length > 0 && intersects[0].object.parent.type === "Group") {
      let ret1 = new RegExp('SI_Prop_ChairTables').test(intersects[0].object.name);//true
      if (ret1) {
        // let selectM = this.onLoaderMaterial("assets/pic/FastFood.png");
        let selectM = this.onLoaderMaterial("assets/pic/wood-floor.jpg");
        let selectObj: any = intersects[0].object;
        selectObj.material = selectM;
      }
    }
  }

  public onMouseUp(event: MouseEvent) {
    console.log("onMouseUp");
  }
  /*  工具函数 */
  // 找到所有对象
  private findAllObjects(pred: THREE.Object3D[], parent: THREE.Object3D) {
    // NOTE: Better to keep separate array of selected objects
    if (parent.children.length > 0) {
      parent.children.forEach((i) => {
        pred.push(i);
        this.findAllObjects(pred, i);
      });
    }
  }
  // 获取屏比
  private getAspectRatio(): number {
    let height = this.canvas.clientHeight;
    if (height === 0) {
      return 0;
    }
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }
  // 渲染函数
  public render() {
    this.renderer.render(this.scene, this.camera);
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
