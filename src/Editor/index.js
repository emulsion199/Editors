import {useLayoutEffect,useState} from 'react'
import rough from 'roughjs/bundled/rough.esm'
import { createElement,getElementAtPosition,adjustElementCoordinates,cursorForPosition,resizeCoordinates} from './util'

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
            if(element)
            {
                const offsetX=clientX-element.x1;
                const offsetY=clientY-element.y1;
                setSelectedElement({...element,offsetX,offsetY})
                if(element.position==="inside")
                {
                    setAction('moving')
                }
                else
                {
                    console.log('resize')
                    setAction("resizing")
                }
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
        if(tool === 'selection')
        {
            const element = getElementAtPosition(clientX,clientY,elements)
            e.target.style.cursor = element ? cursorForPosition(element.position): "default"
        }
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
        if(action==='resizing')
        {
            const {index,tool, position, ...coordinates} = selectedElement;
            const {x1,y1,x2,y2} = resizeCoordinates(clientX,clientY,position,coordinates);
            updateElement(index, x1,y1,x2,y2, tool);
        }
    }
    const onmouseup=(e)=>
    {
        const index = elements.length-1
        if(action === 'drawing'){
            const {x1,y1,x2,y2}=adjustElementCoordinates(elements[index]);
            console.log(x1,y1,x2,y2)
            updateElement(index, x1,y1,x2,y2,tool)
        }
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