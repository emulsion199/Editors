import {useLayoutEffect,useState} from 'react'
import rough from 'roughjs/bundled/rough.esm'
const generator= rough.generator();
const createElement=(index,x1,y1,x2,y2,tool)=>
{
    console.log(tool)
    const roughElement=tool=='line'?generator.line(x1,y1,x2,y2):tool=='rectangle'?generator.rectangle(x1,y1,x2-x1,y2-y1):null
    return {index,x1,y1,x2,y2,tool,roughElement}
}

const distance=(a,b)=>Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2))
const isWithinElement=(x,y,element)=>
{
    const {tool,x1,x2,y1,y2}=element;
    if(tool==='rectangle')
    {
        const minX=Math.min(x1,x2);
        const maxX=Math.max(x1,x2);
        const minY=Math.min(y1,y2);
        const maxY=Math.max(y1,y2);
        return x>=minX && x<=maxX && y>=minY && y<=maxY;
    }else{
        const a={x:x1,y:y1}
        const b={x:x2,y:y2}
        const c={x,y}

        const offset= distance(a,b) - (distance(a,c)+distance(b,c))

        return Math.abs(offset) < 1;
    }
}
const getElementAtPosition=(x,y,elements)=>
{
    return elements.find(element=>isWithinElement(x,y,element))
}
const Editor=()=>
{
    const [tool,setTool]=useState('selection')
    const [elements,setElements]=useState([])
    const [action,setAction]=useState('none')
    const [selectedElement,setSelectedElement]=useState(null);
    const updateElement=(index,x1,y1,x2,y2,tool)=>
    {
        const updatedElement=createElement(index,x1,y1,x2,y2,tool)
        const elementsCopy=[...elements];
        elementsCopy[index]=updatedElement;
        setElements(elementsCopy)
    }
    const onmousedown=(e)=>
    {
        const {clientX,clientY}=e;
        if(tool==='selection')
        {
            const element=getElementAtPosition(clientX,clientY,elements)
            console.log(element)
            if(element)
            {
                const offsetX=clientX-element.x1;
                const offsetY=clientY-element.y1;
                setAction('moving')
                setSelectedElement({...element,offsetX,offsetY})
            }
        }
        else{
            const id = elements.length;
            setAction('drawing');
            const element=createElement(id,clientX,clientY,clientX,clientY,tool)
            setElements(prevState=>[...prevState, element])
        }
    }
    const onmousemove=(e)=>
    {
        const {clientX,clientY}=e;
        if(action==='drawing')
        { 
            const index=elements.length-1;
            const {x1,y1}=elements[index];
            updateElement(index,x1,y1,clientX,clientY,tool)
        }
        if(action==='moving')
        {
            const {index,x1,x2,y1,y2,tool,offsetX,offsetY} = selectedElement
            const width=x2-x1;
            const height=y2-y1;
            const newX=clientX-offsetX
            const newY=clientY-offsetY
            updateElement(index,newX,newY,newX+width,newY+height,tool);
        }
    }
    const onmouseup=(e)=>
    {
        setAction('selection');
        setSelectedElement(null)
    }

    //캔버스 생성//
    useLayoutEffect(()=>{
        const canvas=document.getElementById('canvas');
        const context=canvas.getContext('2d');
        context.clearRect(0,0,canvas.width,canvas.height);
        const roughCanvas=rough.canvas(canvas)
        elements.forEach(({roughElement})=>roughCanvas.draw(roughElement));
      },[elements])




    return(
        <div>
            <canvas
            id="canvas"
            width={window.innerWidth}
            height={window.innerHeight-30}
            onMouseDown={onmousedown}
            onMouseMove={onmousemove}
            onMouseUp={onmouseup}>
            </canvas>
            <button onClick={()=>{setTool('line')}}>선</button>
            <button onClick={()=>{setTool('rectangle')}}>직사각형</button>
            <button onClick={()=>{setTool('selection')}}>선택</button>
        </div>
    )
}
export default Editor