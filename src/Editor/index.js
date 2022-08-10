import {useLayoutEffect,useState} from 'react'
import rough from 'roughjs/bundled/rough.esm'
const generator= rough.generator();
const createElement=(tool,x1,y1,x2,y2)=>
{
    const roughElement=tool==0?generator.line(x1,y1,x2,y2):generator.rectangle(x1,y1,x2-x1,y2-y1)
    return {x1,y1,x2,y2,roughElement}
}
const Editor=()=>
{
    const [tool,setTool]=useState(0)
    const [elements,setElements]=useState([])
    const [drawing,setDrawing]=useState(false)
    const onmousedown=(e)=>
    {
        setDrawing(true);
        const {clientX,clientY}=e;

        const element=createElement(tool,clientX,clientY,clientX,clientY)

        setElements(prevState=>[...prevState, element])
    }
    const onmousemove=(e)=>
    {
        if(!drawing) return;
        const {clientX,clientY}=e;
        const index=elements.length-1;
        const {x1,y1}=elements[index];
        const updatedElement=createElement(tool,x1,y1,clientX,clientY)
        const elementsCopy=[...elements];
        elementsCopy[index]=updatedElement;
        setElements(elementsCopy)
    }
    const onmouseup=(e)=>
    {
        setDrawing(false);
    }
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
    <button onClick={()=>{setTool(0)}}>선</button>
            <button onClick={()=>{setTool(1)}}>직사각형</button>
    </div>
    )
}
export default Editor