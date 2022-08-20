import rough from 'roughjs/bundled/rough.esm'
import getStroke from 'perfect-freehand'
import { useState } from 'react';
const generator= rough.generator();
//pencil
function getSvgPathFromStroke(stroke) {
    if (!stroke.length) return ''
    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length]
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
        return acc
      },
      ['M', ...stroke[0], 'Q']
    )
    d.push('Z')
    return d.join(' ')
  }
const drawCircle=(x,y,context)=>
{
    
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.strokeStyle="rgb(0, 60, 255)"
    context.fillStyle="white"
    context.fill()
    context.stroke();
}
export const drawSelectedBox=(element,context)=>
{
    if(!element) return;
    const {tool,x1,y1,x2,y2}=element;
    context.lineWidth = 1.2; // 선 굵기 10픽셀
    context.strokeStyle="rgb(0, 60, 255)";
    
    context.strokeRect(x1,y1,x2-x1,y2-y1);
    context.fillStyle="rgba(0,60,255,0.1)"
    context.fillRect(x1,y1,x2-x1,y2-y1);
    //draw circle//
    drawCircle(x1,y1,context)
    drawCircle(x2,y2,context)
    if(tool==='rectangle')
    {
        drawCircle(x1,y2,context)
        drawCircle(x2,y1,context)
    }

    
    
}
export const createElement=(index,x1,y1,x2,y2,tool)=>
{
    switch (tool)
    {
        case "line":
        case 'rectangle':
        return {index,x1,y1,x2,y2,tool}
        case 'pencil':
            return {index, points: [{x:x1,y:y1}],tool}
        default:
            throw new Error(`Type not recognized: ${tool}`)

    }
}
export const drawElement=(context, element)=>
{
    const {x1,y1,x2,y2}=element;
    switch (element.tool)
    {
        
        case "line":
            context.beginPath();
            context.moveTo(x1,y1)
            context.lineTo(x2,y2)
            context.lineWidth = 2
            context.strokeStyle = "black"
            context.stroke();

            break;
        case 'rectangle':
            context.strokeStyle="black";
            context.strokeRect(x1,y1,x2-x1,y2-y1);
            context.fillStyle="rgba(12,100,56,0.5)"
            context.fillRect(x1,y1,x2-x1,y2-y1);
            break;
        case 'pencil':
            context.fillStyle="black"
            const stroke = getSvgPathFromStroke(getStroke(element.points,{size:8}))
            context.fill(new Path2D(stroke))
            break;
        default:
            throw new Error(`Type not recognized: ${element.tool}`)

    }
}
export const distance=(a,b)=>Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2))
const nearPoint = (x,y,x1,y1,name)=>
{
    return Math.abs(x-x1)<5 && Math.abs(y-y1)<5 ? name : null;
} 
export const positionWithinElement=(x,y,element)=>
{
    const {tool,x1,x2,y1,y2}=element;
    if(tool==='rectangle')
    {
        const topLeft = nearPoint(x,y,x1,y1,'tl')
        const topRight = nearPoint(x,y,x2,y1,'tr')
        const bottomLeft = nearPoint(x,y,x1,y2,'bl')
        const bottomRight = nearPoint(x,y,x2,y2,'br')
        const inside = x>=x1 && x<=x2 && y>=y1 && y<=y2 ? "inside" : null;
        return topLeft || topRight || bottomLeft || bottomRight || inside
    }else{
        const a={x:x1,y:y1}
        const b={x:x2,y:y2}
        const c={x,y}
        const offset= distance(a,b) - (distance(a,c)+distance(b,c))
        const start = nearPoint(x,y,x1,y1,'start')
        const end = nearPoint(x,y,x2,y2,'end')
        const inside = Math.abs(offset) < 1 ? "inside" : null;
        return start || end || inside
    }
}
export const getElementAtPosition=(x,y,elements)=>
{
    for(var i=elements.length-1; i>=0;i--)
    {
        const position=positionWithinElement(x,y,elements[i])
        if(position!==null){
            return {element:elements[i],position:position}
        }
    }
    return undefined
}
export const adjustElementCoordinates=(element)=>
{
    const {tool,x1,y1,x2,y2} = element;
    
    if(tool === 'rectangle') {
        const minX=Math.min(x1,x2);
        const maxX=Math.max(x1,x2);
        const minY=Math.min(y1,y2);
        const maxY=Math.max(y1,y2);
        
        return {x1:minX,y1:minY,x2:maxX,y2:maxY}
    } else{
        if(x1<x2 || (x1===x2 && y1<y2)){
            return {x1,y1,x2,y2}
        } else{
            return {x1:x2,y1:y2,x2:x1,y2:y1};
        }
    }
}
export const cursorForPosition=(position)=>{
    switch(position)
    {
        case "tl":
        case "br":
        case "start":
        case "end":
            return "nwse-resize";
        case "tr":
        case "bl":
            return "nesw-resize";
        default:
            return "move";
    }
}
export const resizeCoordinates=(clientX,clientY,position,coordinates)=>
{
    const {x1,y1,x2,y2} = coordinates;
    switch(position){
        case "tl":
            return {x1:clientX,y1:clientY,x2,y2}
        case "tr":
            return {x1,y1:clientY,x2:clientX,y2}
        case "bl":
            return {x1:clientX,y1,x2,y2:clientY}
        case "br":
            return {x1,y1,x2:clientX,y2:clientY}
        case "start":
            return {x1:clientX,y1:clientY,x2,y2}
        case "end":
            return {x1,y1,x2:clientX,y2:clientY}
        default:
            return null;
    }
}

export const useHistory = (initialState)=>
{
    const [elements, setElements] = useState(initialState)
}