
import Vector3 = Laya.Vector3;
import Vector2 = Laya.Vector2;
import Label = Laya.Label;


export default class CameraMoveScript extends Laya.Script3D {
		
    constructor() { super();}

    private m_camera:Laya.Camera;
    public  m_scene3d:Laya.Scene3D;

    private m_tempVector3:Vector3;
    private m_lastMouseX:number;
    private m_lastMouseY:number;

    private m_isMouseDown:boolean;
    private m_isRightMouseDown:boolean;
    private m_isMouseWheel:boolean;

    private m_3dMoveSpeed:number;
    private m_3dRotateSpeed:number;
    private m_3dWheelSpeed:number;
    private m_2dMoveSpeed:number;
    private m_2dWheelSpeed:number;
    private m_3dMinZoomDistance:number;
    private m_3dMaxZoomDistance:number;
    private m_3dMinCameraPitchRadian:number;
    private m_3dMaxCameraPitchRadian:number;
    private m_2dMinOrthographicSize:number;

    private m_currentPitchRadian:number;

    private m_isLastTouchDoubleFingers:boolean;
    private m_isRightMouseButtonDown:boolean;
    private m_lastTouchFinger0:Vector2;
    private m_lastTouchFinger1:Vector2;

    private m_lastDistance: number = 0;
    private m_preRadian: number = 0;

    public OnMouseWheel:Function;
    public OnSingleFingerDrag:Function;
    public OnDoubleFingersPinch:Function;
    public OnDoubleFingersTwist:Function;
    public On
   
    private m_forwardLength: number = 3;
    private m_lookAtPoint: Vector3 = new Vector3();
    private m_isTwoFingersTouch: boolean = false;
    private m_twoFingersDistance: number = 0;

    private m_lastTouches:any[];

    protected yawPitchRoll:Laya.Vector3;
    protected resultRotation:Laya.Quaternion;
    protected tempRotationZ:Laya.Quaternion;
    protected tempRotationX:Laya.Quaternion;
    protected tempRotationY:Laya.Quaternion;

    private m_ray:Laya.Ray;
    private m_hitResult:Laya.HitResult;
    private m_hitObject:Laya.MeshSprite3D;
    private m_hitPoint:Laya.Vector3;
    
    public IsShowLable:boolean = true;
    protected m_label: Label;

    public Is2D:Boolean = false;

    protected m_mousePoint:Vector2;

    onAwake(){
        this.Init();

        this.AddEvenets();

        this.RefreshPitchRadian();

        this.RefreshLookAtPoint();
    }

    onUpdate(){
        if(this.IsShowLable)
            this.ShowInfo();

        this.RayCastHit();

        this.CameraToZeroDistance();
    }


    onDestroy(){
        this.RemoveEvents();
    }

    protected Init(){
        this.m_camera = this.owner as Laya.Camera;
        this.m_tempVector3 = new Vector3();
        this.m_mousePoint = new Vector2();
        this.m_lastTouchFinger0 = new Vector2();
        this.m_lastTouchFinger1 = new Vector2();

        this.yawPitchRoll = new Laya.Vector3();
        this.resultRotation = new Laya.Quaternion();
        this.tempRotationZ = new Laya.Quaternion();
        this.tempRotationX = new Laya.Quaternion();
        this.tempRotationY = new Laya.Quaternion();

        this.m_ray = new Laya.Ray(new Vector3(),new Vector3());
        this.m_hitResult = new Laya.HitResult();

        if(this.IsShowLable)
            this.m_label = this.createLabel(new Vector2(10,10))

        this.InitDiffPlatform();
    }

    /**
     * 不同平台不同配置，从json文件中读取
     */
    protected InitDiffPlatform(){
        if(Laya.Browser.onAndroid||Laya.Browser.onIPhone||Laya.Browser.onMobile){
     
            this.m_3dMoveSpeed = 0.02;
            this.m_3dRotateSpeed = 0.004;
            this.m_3dWheelSpeed = 2;
    
            this.m_2dMoveSpeed = 0.02;
            this.m_2dWheelSpeed = 2;
    
            this.m_3dMinZoomDistance = -30;
            this.m_3dMaxZoomDistance = 1000;
            this.m_3dMinCameraPitchRadian = 10 * Math.PI / 180; 
            this.m_3dMaxCameraPitchRadian = 90 * Math.PI / 180;
            this.m_2dMinOrthographicSize = 12;
        }
        else if(Laya.Browser.onPC||Laya.Browser.onMac){
            this.m_3dMoveSpeed = 0.04;
            this.m_3dRotateSpeed = 0.004;
            this.m_3dWheelSpeed = 2;
    
            this.m_2dMoveSpeed = 0.02;
            this.m_2dWheelSpeed = 2;
    
            this.m_3dMinZoomDistance = -30;
            this.m_3dMaxZoomDistance = 1000;
            this.m_3dMinCameraPitchRadian = 10 * Math.PI / 180; 
            this.m_3dMaxCameraPitchRadian = 90 * Math.PI / 180;
            this.m_2dMinOrthographicSize = 12;
        }
    }

    protected AddEvenets(){
        Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.mouseDown);
        Laya.stage.on(Laya.Event.MOUSE_UP, this, this.mouseUp);
        Laya.stage.on(Laya.Event.MOUSE_WHEEL, this, this.mouseWheel);
        Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.mouseMove);
        
        Laya.stage.on(Laya.Event.RIGHT_MOUSE_DOWN, this, this.rightMouseDown);
        Laya.stage.on(Laya.Event.RIGHT_MOUSE_UP, this, this.rightMouseUp);    
    }

    protected RemoveEvents(){
        Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this.mouseDown);
        Laya.stage.off(Laya.Event.MOUSE_UP, this, this.mouseUp);
        Laya.stage.off(Laya.Event.MOUSE_WHEEL, this, this.mouseWheel);
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.mouseMove);
        Laya.stage.off(Laya.Event.RIGHT_MOUSE_DOWN, this, this.rightMouseDown);
        Laya.stage.off(Laya.Event.RIGHT_MOUSE_UP, this, this.rightMouseUp);
    }
    
    protected mouseDown(e: Laya.Event): void {
        this.m_camera.transform.localRotation.getYawPitchRoll(this.yawPitchRoll);
        this.m_lastMouseX = Laya.stage.mouseX;
        this.m_lastMouseY = Laya.stage.mouseY;
        this.m_isMouseDown = true;

        // //Two fingers operation
        var touches: Array<any> = e.touches;
        if (touches && touches.length == 2) {
            this.m_lastTouchFinger0.x = touches[0].stageX;
            this.m_lastTouchFinger0.y = touches[0].stageY;
            this.m_lastTouchFinger1.x = touches[1].stageX;
            this.m_lastTouchFinger1.y = touches[1].stageY;
            this.m_lastDistance = this.getDistance(touches);
            this.m_preRadian = this.atan2Ext(touches[0].stageY - touches[1].stageY, touches[0].stageX - touches[1].stageX);
            this.m_isTwoFingersTouch = true;
        }
    }
    
    protected mouseUp(e:Laya.Event):void {
        this.m_isMouseDown = false;
        var touches: Array<any> = e.touches;
        if (touches && touches.length == 0) {
            this.m_isTwoFingersTouch = false;
        }
    }

    protected rightMouseDown(e: Laya.Event): void {
        this.m_lastMouseX = Laya.stage.mouseX;
        this.m_lastMouseY = Laya.stage.mouseY;
        this.m_isMouseDown = true;
        this.m_isRightMouseButtonDown = true;
    }

    protected rightMouseUp(e: Laya.Event): void {
        this.m_isMouseDown = false;
        this.m_isRightMouseButtonDown = false;
    }

    protected mouseWheel(e:Laya.Event):void {
        if(e == null) return ;
        let zoomDelta: number = e.delta;
        if(this.Is2D){        
            this.m_camera.orthographicVerticalSize += -zoomDelta * this.m_2dWheelSpeed;               
            if(this.m_camera.orthographicVerticalSize < this.m_2dMinOrthographicSize){
                this.m_camera.orthographicVerticalSize = this.m_2dMinOrthographicSize;
            }          
        }else{
            this.cameraZoom(zoomDelta);
        }

        if (this.OnMouseWheel) 
            this.OnMouseWheel(zoomDelta);
    }

    protected mouseMove(e: Laya.Event): void {
        var touches: Array<any> = e.touches;
        if (!touches) {
            this.moveControlByMouse();
        } else {
            this.moveCtrlByTouch(touches);            
        }
    }

     /**
     *  鼠标模式 
     */
    protected moveControlByMouse(){
        if (this.m_isMouseDown) {
            let deltaX: number = Laya.stage.mouseX - this.m_lastMouseX;
            let deltaY: number = Laya.stage.mouseY - this.m_lastMouseY;
            if (!this.m_isRightMouseButtonDown) {
                if (this.m_isLastTouchDoubleFingers) {
                    deltaX = 0; deltaY = 0;
                    this.m_isLastTouchDoubleFingers = false;
                }
                this.moveRight(-this.m_3dMoveSpeed * deltaX);
                this.moveUp(this.m_3dMoveSpeed * deltaY);
                this.RefreshLookAtPoint();
            } else {
                if(this.Is2D) return ;

                let deltaX: number = Laya.stage.mouseX - this.m_lastMouseX;
                let deltaY: number = Laya.stage.mouseY - this.m_lastMouseY;
                this.rotateAround(-deltaY * this.m_3dRotateSpeed, -deltaX * this.m_3dRotateSpeed);
            }
            this.m_lastMouseX = Laya.stage.mouseX;
            this.m_lastMouseY = Laya.stage.mouseY;
        }
    }

    /**
     * 触控模式
     */
    protected moveCtrlByTouch(touches:Array<any>){
        if (touches.length == 1 && !this.m_isTwoFingersTouch) {
            //单指触控
            // this.camera.transform.localRotation.getYawPitchRoll(this.yawPitchRoll);
            let deltaX: number = Laya.stage.mouseX - this.m_lastMouseX;
            let deltaY: number = Laya.stage.mouseY - this.m_lastMouseY;

            if (this.m_isLastTouchDoubleFingers) {
                //如果上一次操作是双指,如双指操作时,抬起一指变单指操作,要做个清零,防止摄像机跳跃
                deltaX = 0;
                deltaY = 0;
                this.m_isLastTouchDoubleFingers = false;
            }
            //let speed: number = 0.06;
            this.moveRight(-this.m_3dMoveSpeed * deltaX);
            this.moveUp(this.m_3dMoveSpeed * deltaY);
            this.m_lastMouseX = Laya.stage.mouseX;
            this.m_lastMouseY = Laya.stage.mouseY;

            this.RefreshLookAtPoint();

        }
        else if (touches.length == 2) {
            if(this.Is2D){
                let distance2: number = this.getDistance(touches);
                const factor2: number = 0.1;

                let pinchValue2: number = 0;

                pinchValue2 = (distance2 - this.m_lastDistance) * factor2;

                this.m_lastDistance = distance2;

                this.m_camera.orthographicVerticalSize -= pinchValue2;   

                if(this.m_camera.orthographicVerticalSize < this.m_2dMinOrthographicSize){
                    this.m_camera.orthographicVerticalSize = this.m_2dMinOrthographicSize;
                }
            }else{

                //双指触控
                this.m_isTwoFingersTouch = true;
                this.m_isLastTouchDoubleFingers = true;

                let twoFingersDistance: number = this.getTwoFingersDistance(touches);
                let deltaDistance: number = Math.abs(twoFingersDistance - this.m_twoFingersDistance);
                this.m_twoFingersDistance = twoFingersDistance;
                
                //Two fingers drag
                let deltaX0: number = touches[0].stageX - this.m_lastTouchFinger0.x;
                let deltaY0: number = touches[0].stageY - this.m_lastTouchFinger0.y;
                let deltaX1: number = touches[1].stageX - this.m_lastTouchFinger1.x;
                let deltaY1: number = touches[1].stageY - this.m_lastTouchFinger1.y;
                let deltaY = (deltaY0 + deltaY1) * 0.5;
                let deltaX = (deltaX0 + deltaX1) * 0.5;
                this.rotateAround(-deltaY * this.m_3dRotateSpeed, 0);

                this.m_lastTouchFinger0.x = touches[0].stageX;
                this.m_lastTouchFinger0.y = touches[0].stageY;
                this.m_lastTouchFinger1.x = touches[1].stageX;
                this.m_lastTouchFinger1.y = touches[1].stageY;

                //Two fingers pinch
                let distance: number = this.getDistance(touches);
                const factor: number = 0.01;
                let pinchValue: number = 0;
                pinchValue += (distance - this.m_lastDistance) * factor;
                this.m_lastDistance = distance;
                const fingerPinchSpeed: number = 10;
                this.cameraZoom(pinchValue * fingerPinchSpeed);
                if (this.OnDoubleFingersPinch)
                    this.OnDoubleFingersPinch(pinchValue);
                
                //Two fingers twist
                let nowRadian: number = this.atan2Ext(touches[0].stageY - touches[1].stageY, touches[0].stageX - touches[1].stageX);
                let deltaRadian: number = nowRadian - this.m_preRadian;
                if (deltaRadian != 0) {
                    let twistValue: number = 180 / Math.PI * deltaRadian;
                    this.rotateAround(0, twistValue * 0.1);
                    this.m_preRadian = nowRadian;
                    if (this.OnDoubleFingersTwist)
                        this.OnDoubleFingersTwist(twistValue);
                }
            }
        }
    }

    /**
     * 向前移动。
     * @param distance 移动距离。
     */
    protected moveForward(distance:number):void {
        this.m_tempVector3.x = this.m_tempVector3.y = 0;
        this.m_tempVector3.z = distance;
        this.m_camera.transform.translate(this.m_tempVector3);
    }
    
    /**
     * 向右移动。
     * @param distance 移动距离。
     */
    protected moveRight(distance:number):void {
        this.m_tempVector3.y = this.m_tempVector3.z = 0;
        this.m_tempVector3.x = distance;
        this.m_camera.transform.translate(this.m_tempVector3);
    }
    
    /**
     * 向上移动。
     * @param distance 移动距离。
     */
    protected moveUp(distance:number):void {
        this.m_tempVector3.x = this.m_tempVector3.z = 0;
        this.m_tempVector3.y = distance;
        this.m_camera.transform.translate(this.m_tempVector3, true);
    }

    /**
     * 缩放
     * @param delta 
     */
    protected cameraZoom(delta: number): void{
        // if(this.m_hitObject!=null && !this.m_isRightMouseDown){
        //     this.m_forwardLength = this.getTwoPointsDistance(
        //         this.m_camera.transform.position,this.m_hitPoint);        
        // }
        let currentForwardLength: number = this.m_forwardLength;
        let distance: number = -delta * this.m_3dWheelSpeed;
        currentForwardLength += distance;
        if (delta > 0) {
            //拉近
            if (currentForwardLength < this.m_3dMinZoomDistance)  
                distance += (this.m_3dMinZoomDistance - currentForwardLength);
            
        } else {
            //拉远
            if (currentForwardLength > this.m_3dMaxZoomDistance)  
                distance -= (currentForwardLength - this.m_3dMaxZoomDistance);
        }
        this.moveForward(distance);
        this.m_forwardLength += distance;
    }

    /**
     * 旋转
     * @param angleX 
     * @param angleY 
     */
    protected rotateAround(angleX: number, angleY: number): void {
        let currentRadian: number = this.m_currentPitchRadian;
        currentRadian -= angleX;
        if (angleX < 0) {
            //下拖动,往上转
            if (currentRadian > this.m_3dMaxCameraPitchRadian)  
                angleX += (currentRadian - this.m_3dMaxCameraPitchRadian);
        } else {
            //上拖动,往下转
            if (currentRadian < this.m_3dMinCameraPitchRadian)  
                angleX += (currentRadian - this.m_3dMinCameraPitchRadian);
        }

        this.m_camera.transform.rotate(new Vector3(angleX, 0, 0));
        this.m_camera.transform.rotate(new Vector3(0, angleY, 0), false);

        let forward: Vector3 = new Vector3();
        this.m_camera.transform.getForward(forward);
        let newPosition: Vector3 = new Vector3();
        Vector3.scale(forward, -1, forward);
        newPosition = this.Forward(this.m_lookAtPoint, forward, this.m_forwardLength);
        this.m_camera.transform.position = newPosition;

        this.RefreshPitchRadian();
    }


    protected _updateRotation():void {
        if (Math.abs(this.yawPitchRoll.y) < 1.50) {
            Laya.Quaternion.createFromYawPitchRoll(this.yawPitchRoll.x, this.yawPitchRoll.y, this.yawPitchRoll.z, this.tempRotationZ);
            this.tempRotationZ.cloneTo(this.m_camera.transform.localRotation);
            this.m_camera.transform.localRotation = this.m_camera.transform.localRotation;
        }
    }

    //把Math.atan2值域映射到[0, 2pi]
    protected atan2Ext(y: number, x: number): number {
        let radian: number = Math.atan2(y, x);
        if (radian >= 0)
            return radian;
        else
            return radian + 2 * Math.PI;
    }

    protected getTwoFingersDistance(touches: Array<any>): number {
        let fingersDistance: number = 0;
        var dx: number = touches[0].stageX - touches[1].stageX;
        var dy: number = touches[0].stageY - touches[1].stageY;
        fingersDistance = Math.sqrt(dx * dx + dy * dy);
        return fingersDistance;
    }

    protected rotateAroundY(ponit: Vector3, radius: number, angle: number): void {
        let posX: number = Math.cos(angle) * radius;
        let posY: number = Math.sin(angle) * radius;
        this.m_camera.transform.position = new Vector3(posX, this.m_camera.transform.position.y, posY);
        this.m_camera.transform.lookAt(ponit, new Vector3(0, 1, 0), false);
    }

    protected rotateAroundX(ponit: Vector3, radius: number, angle: number): void {
        this.m_camera.transform.rotate(new Vector3(angle, 0, 0));
        let forward: Vector3 = new Vector3();
        this.m_camera.transform.getForward(forward);
        let position: Vector3 = new Vector3();   
        let deltaPosition: Vector3 = new Vector3();   
        Vector3.scale(forward, -radius, deltaPosition); 
        Vector3.add(ponit, deltaPosition, position); 
        this.m_camera.transform.position = position;
    }

    //计算两个触摸点之间的距离
    protected getDistance(points: Array<any>): number {
        let distance:number = 0;
        if (points && points.length == 2) {
            var dx: number = points[0].stageX - points[1].stageX;
            var dy: number = points[0].stageY - points[1].stageY;
            distance = Math.sqrt(dx * dx + dy * dy);
        }
        return distance;
    }
    
    protected getTwoPointsDistance(pointA: Vector3, pointB: Vector3): number {
        var distance: number = 0;
        var dx: number = pointA.x - pointB.x;
        var dy: number = pointA.y - pointB.y;
        var dz: number = pointA.z - pointB.z;
        distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance;
    }

    protected Forward(position: Vector3, direction: Vector3, distance: number): Vector3 {
        let deltaPosition: Vector3 = new Vector3();   
        let newPosition: Vector3 = new Vector3();   
        Vector3.scale(direction, distance, deltaPosition); 
        Vector3.add(position, deltaPosition, newPosition); 
        return newPosition;
    }

    protected RefreshLookAtPoint(): void {
        let forward: Vector3 = new Vector3();
        this.m_camera.transform.getForward(forward);
        this.m_lookAtPoint = this.Forward(this.m_camera.transform.position, forward, this.m_forwardLength);
    }

    protected RefreshPitchRadian(): void {
        this.m_camera.transform.localRotation.getYawPitchRoll(this.yawPitchRoll);
        this.m_currentPitchRadian = Math.abs(this.yawPitchRoll.y);
    }


    //temp
    protected CameraToZeroDistance(){
        var dis:number = 0;
        if(this.Is2D){
            dis = this.m_camera.orthographicVerticalSize;
        }else{
            let camPos = this.m_camera.transform.position;
            dis = Vector3.distance(camPos,Vector3._ZERO);
            this.m_label.text += "摄像机到原点的距离：" + dis;        
        }
        //EventManager.Instance().PostEvent(Events.OnCameraDistanceChanged.toString(),dis);    
    }
    
   
    /**
     * 绕给定点和轴旋转
     * @param target 旋转对象
     * @param rotatePos 给定点位置
     * @param dir 给定方向
     * @param angle 旋转角度，弧度
     */
    protected RotateAround(target:Laya.Sprite3D,rotatePos:Laya.Vector3,dir:Laya.Vector3,angle:number){
        //创建一个四元数
        let quaternion = new Laya.Quaternion();
        Laya.Quaternion.createFromAxisAngle(dir,angle,quaternion);

        //计算旋转后的Position
        let deltapos = new Laya.Vector3();
        Laya.Vector3.subtract(target.transform.position,rotatePos,deltapos);
        let changeVector3 :Laya.Vector3 = new Laya.Vector3();
        Laya.Vector3.transformQuat(deltapos,quaternion,changeVector3);
        let resultPos  = new Laya.Vector3(); 
        Laya.Vector3.add(changeVector3,rotatePos,resultPos);
        target.transform.position = resultPos;

        //计算旋转后的Rotation
        let newRotation = new Laya.Quaternion();
        Laya.Quaternion.multiply(target.transform.rotation,quaternion,newRotation);
        target.transform.rotation = newRotation;
    }

     /**
     * 根据碰撞对象的位置，设置摄像机的缩放和旋转轴等；
     * 旋转操作，以屏幕中心点发出射线，如果有碰撞对象，则将碰撞点作为旋转中心，如果没有则将（0,0,0）设为旋转中心；
     * 缩放操作，以鼠标位置发出射线，若有碰撞对象，则根据碰撞点与摄像机的距离限制摄像机的最小距离；
     */
    protected RayCastHit(){
        if(this.m_camera!=null && this.m_scene3d!=null){

            this.m_mousePoint.x = Laya.stage.mouseX;
            this.m_mousePoint.y = Laya.stage.mouseY;   

            this.m_camera.viewportPointToRay(this.m_mousePoint,this.m_ray);
            this.m_scene3d.physicsSimulation.rayCast(this.m_ray,this.m_hitResult);

            if(this.m_hitResult.succeeded){
                this.m_hitObject = this.m_hitResult.collider.owner as Laya.MeshSprite3D;
                this.m_hitPoint = this.m_hitResult.point;
            }
            else{
                this.m_hitObject = null;
            }
        }
    }

    /**
     * 创建一个Lable
     * @param color 
     * @param strokeColor 
     */
    private createLabel(pos:Laya.Vector2, color?: string, strokeColor?: string): Label {
        const _color = "#ffffff";
        const _strokeColor = "#000000";
        const _strokeWidth: number = 1;

        var label: Label = new Label();
        
        label.font = "Microsoft YaHei";
        label.text = "SAMPLE DEMO";
        label.fontSize = 20;
        if(color){
            label.color = color;
        }else{
            label.color = _color;
        }    
        if (strokeColor) {
            label.stroke = _strokeWidth;
            label.strokeColor = _strokeColor;
        }
        label.pos(pos.x,pos.y);
        Laya.stage.addChild(label);
        return label;
    }


    private ShowInfo(){
        var pos:Laya.Vector3 = this.m_camera.transform.position;
        var rot:Laya.Vector3 = this.m_camera.transform.rotationEuler;
        this.m_label.text = "Camera Pos : (" + pos.x.toFixed(2) + "," + pos.y.toFixed(2) + "," + pos.z.toFixed(2) + ")" + "\n";
        this.m_label.text += "Camera Rot : (" + rot.x.toFixed(2) + "," + rot.y.toFixed(2) + "," + rot.z.toFixed(2) + ")"+ "\n";
        this.m_label.text += "Camera orthographicVerticalSize : " + this.m_camera.orthographicVerticalSize+ "\n";
        this.m_label.text += "Mouse PosX : " + Laya.stage.mouseX+ "\n";
        this.m_label.text += "Mouse PosY : " + Laya.stage.mouseY+ "\n";

        this.m_label.text += "是否在2D: " + this.Is2D + "\n";
        this.m_label.text += "this forwardlength: " + this.m_forwardLength + "\n";

        this.m_label.text += "3dMoveSpeed : " +   this.m_3dMoveSpeed+ "\n";
        this.m_label.text += "2dMoveSpeed : " +   this.m_2dMoveSpeed+ "\n";
    }
}
