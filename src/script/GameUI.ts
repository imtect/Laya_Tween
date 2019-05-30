import { ui } from "./../ui/layaMaxUI";
import MtTween from "./MtTween";
import CameraMoveScript from "./CameraMoveScript";
/**
 * 本示例采用非脚本的方式实现，而使用继承页面基类，实现页面逻辑。在IDE里面设置场景的Runtime属性即可和场景进行关联
 * 相比脚本方式，继承式页面类，可以直接使用页面定义的属性（通过IDE内var属性定义），比如this.tipLbll，this.scoreLbl，具有代码提示效果
 * 建议：如果是页面级的逻辑，需要频繁访问页面内多个元素，使用继承式写法，如果是独立小模块，功能单一，建议用脚本方式实现，比如子弹脚本。
 */
export default class GameUI extends ui.test.TestSceneUI {

    box:Laya.MeshSprite3D;

    constructor() {
        super();
		
        //添加3D场景
        var scene: Laya.Scene3D = Laya.stage.addChild(new Laya.Scene3D()) as Laya.Scene3D;

        //添加照相机
        var camera: Laya.Camera = (scene.addChild(new Laya.Camera(0, 0.1, 100))) as Laya.Camera;
        camera.transform.translate(new Laya.Vector3(0, 10, 18));
        camera.transform.rotate(new Laya.Vector3(-30, 0, 0), true, false);
        camera.clearColor = new Laya.Vector4(1,1,1,1);
        camera.addComponent(CameraMoveScript)

        //添加方向光
        var directionLight: Laya.DirectionLight = scene.addChild(new Laya.DirectionLight()) as Laya.DirectionLight;
        directionLight.color = new Laya.Vector3(0.6, 0.6, 0.6);
        directionLight.transform.worldMatrix.setForward(new Laya.Vector3(1, -1, 0));

        // var box1 = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createBox(1, 1, 1)) ;
        // scene.addChild(box1); 
        // box1.transform.rotate(new Laya.Vector3(0, 45, 0), false, false);
        // var material2: Laya.BlinnPhongMaterial = new Laya.BlinnPhongMaterial();
		// Laya.Texture2D.load("res/layabox.png", Laya.Handler.create(null, function(tex:Laya.Texture2D) {
		// 		material2.albedoTexture = tex;
        // }));
        // box1.meshRenderer.material = material2;


        //添加自定义模型
        this.box = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createBox(1, 1, 1)) ;
        scene.addChild(this.box); 
        this.box.transform.rotate(new Laya.Vector3(0, 45, 0), false, false);
        var material: Laya.BlinnPhongMaterial = new Laya.BlinnPhongMaterial();
		Laya.Texture2D.load("res/layabox.png", Laya.Handler.create(null, function(tex:Laya.Texture2D) {
				material.albedoTexture = tex;
        }));
        material.albedoColor = new Laya.Vector4(1,1,1,0.3);
        this.box .meshRenderer.material = material;
    

        Laya.stage.on(Laya.Event.KEY_DOWN,this,(e:Laya.Event)=>{
            if(e.keyCode == Laya.Keyboard.SPACE){
            //    let moveT = MtTween.Move(this.box,new Laya.Vector3(10,0,0),1000); moveT.repeat = 0;
            //    let rotateT = MtTween.Rotate(this.box,new Laya.Vector3(0,90,0),1000); rotateT.repeat = 0;
                let scaleT = MtTween.Scale(this.box,new Laya.Vector3(5,5,5),1000); scaleT.repeat = 0;

                let alphat =  MtTween.Alpha(this.box,0.5,1000);// alphat.repeat = 0;

                // let mat = this.box.meshRenderer.material as Laya.BlinnPhongMaterial;
                // mat.albedoColor = new Laya.Vector4(1,1,1,0.5);
            }
        });
        
    }
}