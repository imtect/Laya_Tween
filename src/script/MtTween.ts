/**
 * ~封装Laya.Tween，用于适应Sprite3D的缓动效果。
 * ~Laya.Tween之所以不适用于Sprite3D是因为浅拷贝变量无法同步到原对象中去；
 * ~解决方式是：Laya.Tween来改变变量值，用update更新对象对应的变量值；
 * ~封装原生的Laya.Tween，支持所有Ease效果
 */

import Vector3 = Laya.Vector3;
import Handler = Laya.Handler;
import Sprite3D = Laya.Sprite3D;
import MeshSprite3D = Laya.MeshSprite3D;

export default class MtTween{

    /**
     * 平移，改变Target的位置
     * @param target 目标，必须为Sprite3D
     * @param position 移动的目标位置,Vector3
     * @param duration 移动的时间
     * @param ease 缓动方式
     * @param complete 完成回掉
     * @param delay 延迟缓动时间
     * @param coverBefore 是否覆盖之前的缓动。
     * @param autoRecover 是否自动回收，默认为true，缓动结束之后自动回收到对象池。
     */
    static Move(target:Sprite3D,position:Vector3,duration:number,ease?:Function,complete?:Handler,delay?:number,coverBefore?:boolean,autoRecover?:boolean):Laya.Tween{
        if(target == null) return null;
        let pos = target.transform.position;
        let tween = Laya.Tween.to(pos,{
                x:position.x,
                y:position.y,
                z:position.z,
                update:new Handler(target,function(){
                    this.transform.position = pos;
                })
            },duration,ease,complete,delay,coverBefore,autoRecover);
       return tween;
    }

    /**
     * 旋转，改变Target的旋转角度
     * @param target 目标，必须为Sprite3D
     * @param rotation 移动的目标旋转角度,Vector3
     * @param duration 移动的时间
     * @param ease 缓动方式
     * @param complete 完成回掉
     * @param delay 延迟缓动时间
     * @param coverBefore 是否覆盖之前的缓动。
     * @param autoRecover 是否自动回收，默认为true，缓动结束之后自动回收到对象池。
     */
    static Rotate(target:Sprite3D,rotation:Vector3,duration:number,ease?:Function,complete?:Handler,delay?:number,coverBefore?:boolean,autoRecover?:boolean):Laya.Tween{
        if(target == null) return null;
        let rot = target.transform.rotationEuler;
        let tween = Laya.Tween.to(rot,{
                x:rotation.x,
                y:rotation.y,
                z:rotation.z,
                update:new Handler(target,function(){
                    this.transform.rotationEuler = rot;
                })
            },duration,ease,complete,delay,coverBefore,autoRecover);
       return tween;
    }


    /**
     * 缩放 改变Target的缩放值
     * @param target 目标，必须为Sprite3D
     * @param scale 移动的目标缩放,Vector3
     * @param duration 移动的时间
     * @param ease 缓动方式
     * @param complete 完成回掉
     * @param delay 延迟缓动时间
     * @param coverBefore 是否覆盖之前的缓动。
     * @param autoRecover 是否自动回收，默认为true，缓动结束之后自动回收到对象池。
     */
    static Scale(target:Sprite3D,scale:Vector3,duration:number,ease?:Function,complete?:Handler,delay?:number,coverBefore?:boolean,autoRecover?:boolean):Laya.Tween{
        if(target == null) return null;
        let _scale = target.transform.scale;
        let tween = Laya.Tween.to(_scale,{
                x:scale.x,
                y:scale.y,
                z:scale.z,
                update:new Handler(target,function(){
                    this.transform.scale = _scale;
                })
            },duration,ease,complete,delay,coverBefore,autoRecover);
       return tween;
    }
    
    
    /**
     * 透明度 改变Target的透明度，必须将模型的RenderMode改成Transparent
     * @param target Target,必须有MeshRender
     * @param aplha 透明度
     * @param duration 缓动的时间
     * @param ease 缓动方式
     * @param complete 完成回掉
     * @param delay 延迟缓动时间
     * @param coverBefore 是否覆盖之前的缓动。
     * @param autoRecover 是否自动回收，默认为true，缓动结束之后自动回收到对象池。
     */
    static Alpha(target:MeshSprite3D,aplha:number,duration:number,ease?:Function,complete?:Handler,delay?:number,coverBefore?:boolean,autoRecover?:boolean):Laya.Tween{
        if(target == null) return null;
        let render:Laya.MeshRenderer = target.meshRenderer;
        if(render && render.material){
            let mat:Laya.BlinnPhongMaterial = render.material  as Laya.BlinnPhongMaterial;
            mat.renderMode = Laya.BlinnPhongMaterial.RENDERMODE_TRANSPARENT;
            let albedo = mat.albedoColor;
            if(albedo){
                let tween = Laya.Tween.to(albedo,{ 
                    w:aplha,
                    update:new Handler(target,function(){
                        this.meshRenderer.material.albedoColor = albedo;
                    })
                },duration,ease,Handler.create(target,()=>{
                    if(!tween.repeat) mat.renderMode = Laya.BlinnPhongMaterial.RENDERMODE_OPAQUE;
                    if(complete) complete.run();
                }),delay,coverBefore,autoRecover);   
                return tween;
            }
        }
        return null;
    }
}



