import rough from 'roughjs/bundled/rough.esm'
import getStroke from 'perfect-freehand'
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





export const createSelectedBox=(index,x1,y1,x2,y2,tool)=>
{
    const roughElement=generator.rectangle(x1,y1,x2-x1,y2-y1,{
      })
    return {index,x1,y1,x2,y2,tool,roughElement}
}
export const createElement=(index,x1,y1,x2,y2,tool)=>
{
    switch (tool)
    {
        case "line":
        case 'rectangle':
        const roughElement= tool=='line'
        ?generator.line(x1,y1,x2,y2)
        :generator.rectangle(x1,y1,x2-x1,y2-y1,{
            fill: "rgba(10,150,10,0.5)",
            fillStyle:'solid',
            fillWeight: 1 // thicker lines for hachure
          })
        return {index,x1,y1,x2,y2,tool,roughElement}
        case 'pencil':
            return {index, points: [{x:x1,y:y1}],tool}
        default:
            throw new Error(`Type not recognized: ${tool}`)

    }
}
export const drawElement=(roughCanvas, context, element)=>
{
    switch (element.tool)
    {
        
        case "line":
        case 'rectangle':
            roughCanvas.draw(element.roughElement)
            break;
        case 'pencil':
            const stroke = getSvgPathFromStroke(getStroke(element.points,{size:5}))
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
        elements[i].position=positionWithinElement(x,y,elements[i])
        if(elements[i].position!==null){
            return elements[i]
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