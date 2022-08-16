import {useLayoutEffect,useState} from 'react'
import rough from 'roughjs/bundled/rough.esm'
import { drawElement,createSelectedBox,createElement,getElementAtPosition,adjustElementCoordinates,cursorForPosition,resizeCoordinates} from './util'

const Editor=()=>
{
    const [tool,setTool]=useState('pencil')
    const [elements,setElements]=useState([]) //for selectedBox
    const [action,setAction]=useState('none')
    const [selectedElement,setSelectedElement]=useState(null);

    const updateElement=(index,x1,y1,x2,y2,tool)=>
    {
        const elementsCopy=[...elements];
        switch (tool)
        {
            case "line":
            case "rectangle":
                elementsCopy[index]=createElement(index,x1,y1,x2,y2,tool)
                break;
            case "pencil":
                elementsCopy[index].points = [...elementsCopy[index].points,{x: x2,y: y2}]
                break;
            default:
                throw new Error(`Type not recognized ${tool}`)
        }
        setElements(elementsCopy)
        
    }

    const onmousedown=(e)=>
    {
        const {clientX,clientY}=e;
        const id = elements.length;
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
                    setAction("resizing")
                }
            }
        }
        else{
            
            setAction('drawing');
            const element=createElement(id,clientX,clientY,clientX,clientY,tool)
            setElements(prevState=>[...prevState, element])
            
        }
    }
    const onmousemove=(e)=>
    {
        const id = elements.length;
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
        
        if(action === 'drawing' && (tool==='rectangle' || tool === 'line')){
            const index = elements.length-1

            const {x1,y1,x2,y2}=adjustElementCoordinates(elements[index]);

            updateElement(index, x1,y1,x2,y2,tool)
        }
        if( action ==='resizing')
        {
            const index = selectedElement.index           
            const {x1,y1,x2,y2} = adjustElementCoordinates(elements[index]);
            updateElement(index, x1,y1,x2,y2,selectedElement.tool)
        }    
        setAction('selection');
        setSelectedElement(null);
    }

    //캔버스 생성//
    useLayoutEffect(()=>{
        const canvas=document.getElementById('canvas');
        const context=canvas.getContext('2d');
        context.clearRect(0,0,canvas.width,canvas.height);
        const roughCanvas=rough.canvas(canvas)
        elements.forEach(element => drawElement(roughCanvas, context, element));
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
            <button onClick={()=>{setTool('pencil')}}>그리기</button>
            <button onClick={()=>{setTool('line')}}>선</button>
            <button onClick={()=>{setTool('rectangle')}}>직사각형</button>
            <button onClick={()=>{setTool('selection')}}>선택</button>
        </div>
    )
}
export default Editor