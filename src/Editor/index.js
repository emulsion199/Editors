import {useEffect, useLayoutEffect,useState} from 'react'
import rough from 'roughjs/bundled/rough.esm'
import { drawElement,createSelectedBox,createElement,getElementAtPosition,adjustElementCoordinates,cursorForPosition,resizeCoordinates} from './util'
import yorkie from 'yorkie-js-sdk'
var client=null;
var doc= null;
var canvas= null;
var context=null;
var roughCanvas=null;
const Editor=()=>
{
    const [tool,setTool]=useState('pencil')
    const [action,setAction]=useState('none')
    const [selectedElement,setSelectedElement]=useState(null);
    const [selectedPosition, setSelectedPosition]=useState(null);
    const updateElement=(index,x1,y1,x2,y2,tool)=>
    {
        switch (tool)
        {
            case "line":
            case "rectangle":  
                doc.update((root)=>{
                const element=createElement(index,x1,y1,x2,y2,tool)
                root.shapes[index].index=element.index
                root.shapes[index].x1=element.x1
                root.shapes[index].y1=element.y1
                root.shapes[index].x2=element.x2
                root.shapes[index].y2=element.y2
                root.shapes[index].roughElement=element.roughElement
                
                }
                )
                break;
            case "pencil":
                doc.update((root)=>
                root.shapes[index].points.push({x: x2,y: y2}))
                break;
            default:
                throw new Error(`Type not recognized ${tool}`)
        }
        
        
    }

    const onmousedown=(e)=>
    {
        const {clientX,clientY}=e;
        const id = doc.getRoot().shapes.length;
        if(tool==='selection')
        {
            const {element,position}=getElementAtPosition(clientX,clientY,doc.getRoot().shapes)
            setSelectedPosition(position)
            console.log(position)
            if(element)
            {
                
                const offsetX=clientX-element.x1;
                const offsetY=clientY-element.y1;
                setSelectedElement({...element,offsetX,offsetY})
                
                if(position==="inside")
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
            doc.update((root)=>{
                root.shapes.push(element);
             
            }
            )
           
            drawAll()
        }
    }
    const onmousemove=(e)=>
    {
        
        const {clientX,clientY}=e;
        if(tool === 'selection')
        {
            const elements=doc.getRoot().shapes;
            const element = getElementAtPosition(clientX,clientY,elements)
            e.target.style.cursor = element ? cursorForPosition(element.position): "default"
            
        }
        if(action==='drawing')
        { 
            const elements=doc.getRoot().shapes;
            const index=elements.length-1;
            const {x1,y1}=elements[index];
            updateElement(index,x1,y1,clientX,clientY,tool)
            drawAll()
            
        }
        if(action==='moving')
        {
            const {index,x1,x2,y1,y2,tool,offsetX,offsetY} = selectedElement
            const width=x2-x1;
            const height=y2-y1;
            const newX=clientX-offsetX
            const newY=clientY-offsetY
            updateElement(index,newX,newY,newX+width,newY+height,tool);
            drawAll();
            
        }
        if(action==='resizing')
        {
            const {index,tool, ...coordinates} = selectedElement;
            const {x1,y1,x2,y2} = resizeCoordinates(clientX,clientY,selectedPosition,coordinates);
            updateElement(index, x1,y1,x2,y2, tool);
            drawAll();
        }
       
        
    }
    const onmouseup=(e)=>
    {
        
        if(action === 'drawing' && (tool==='rectangle' || tool === 'line')){
            const index = doc.getRoot().shapes.length-1
            const {x1,y1,x2,y2}=adjustElementCoordinates(doc.getRoot().shapes[index]);

            updateElement(index, x1,y1,x2,y2,tool)
        }
        if( action ==='resizing')
        {
            const index = selectedElement.index           
            const {x1,y1,x2,y2} = adjustElementCoordinates(doc.getRoot().shapes[index]);
            updateElement(index, x1,y1,x2,y2,selectedElement.tool)
        }    
        setAction('selection');
        setSelectedElement(null);
    }

    //캔버스 생성//
    function drawAll()
    {
        
        const root = doc.getRoot();
        context.clearRect(0,0,canvas.width,canvas.height);
        root.shapes.forEach(element => drawElement(roughCanvas, context, element));
        console.log(root.shapes)
    }
    useLayoutEffect(()=>{
        canvas=document.getElementById('canvas');
        context=canvas.getContext('2d');
        roughCanvas=rough.canvas(canvas)        
    },[])
    //Yorkie//

    async function activateClient()
    {

            client = new yorkie.Client(`https://api.fillkie.com`)
            await client.activate();   
            doc = new yorkie.Document('da321asaasa');   
            await client.attach(doc);
            subscribeDoc();   
            doc.update((root) => {
                if(root.shapes)
                {
                    return
                }
                root.shapes=[]
                });
            drawAll()
            
    }
    function subscribeDoc()
    {
        if(doc ===null) return;
        doc.subscribe((event) => {
            if (event.type === 'remote-change') {
                drawAll()
            }
            });
        
    }
    useLayoutEffect(()=> {
        if(client===null)
        {
            activateClient();
            
        }
    }
    ,[])
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