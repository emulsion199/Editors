import {useEffect, useLayoutEffect,useState} from 'react'
import rough from 'roughjs/bundled/rough.esm'
import {drawSelectedBox, drawElement,createSelectedBox,createElement,getElementAtPosition,adjustElementCoordinates,cursorForPosition,resizeCoordinates} from './util'
import yorkie from 'yorkie-js-sdk'
var client=null;
var doc= null;
var canvas= null;
var context=null;
var pencilR=null;
var pencilStart=null;
const docVal='test'
const Editor=()=>
{
    const [users,setUsers]=useState([])
    const [tool,setTool]=useState('pencil')
    const [action,setAction]=useState('none')
    const [selectedElement,setSelectedElement]=useState(null);
    const [selectedPosition, setSelectedPosition]=useState(null);
    const [loading, setLoading]= useState(0);
    //const [eraseList,setEraseList]=useState([]);

    const movePencil=(index,tool,offsetX,offsetY)=>
    {
        doc.update((root)=>
        {
            root.shapes[index].moveXY.x=offsetX
            root.shapes[index].moveXY.y=offsetY
        })
    }
    const removeElement=(element)=>
    {
        doc.update((root)=>{
            root.shapes[element.index].removed=true
            }
            )
    }
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

    const onmousedown=(e,type)=>
    {
        const clientX=type=="des"?e.clientX:e.touches[0].clientX
        const clientY=type=="des"?e.clientY:e.touches[0].clientY
       
        
        const id = doc.getRoot().shapes.length;
        drawAll()
        if(tool==='selection')
        {
            const getElement=getElementAtPosition(clientX,clientY,doc.getRoot().shapes)

            if(getElement)
            {
                const {element,position,pencilRange}=getElement
                pencilR=pencilRange
                
                setSelectedPosition(position)
                if(element.tool=='pencil')
                {
                    pencilStart={x:clientX,y:clientY}
                   
                    drawSelectedBox(element,context,pencilRange)
                    const offsetX=pencilRange.x1-element.moveXY.x+(clientX-pencilRange.x1);
                    const offsetY=pencilRange.y1-element.moveXY.y+(clientY-pencilRange.y1);;
                    setSelectedElement({...element,offsetX,offsetY})
                }

                else{
                    drawSelectedBox(element,context)
                    const offsetX=clientX-element.x1;
                    const offsetY=clientY-element.y1;
                    setSelectedElement({...element,offsetX,offsetY})
                }
                
                
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
        else if(tool==='eraser')
        {
            setAction('erasing')
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
    const onmousemove=(e,type)=>
    {
        
        const clientX=type=="des"?e.clientX:e.touches[0].clientX
        const clientY=type=="des"?e.clientY:e.touches[0].clientY
       
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
        if(action==='erasing')
        {
            const elements=doc.getRoot().shapes;
            const element = getElementAtPosition(clientX,clientY,elements)
            if(element)
            {
                removeElement(element.element)
                drawAll()
            }
            
        }
        if(action==='moving')
        {
            
            if(selectedElement.tool==='line' || selectedElement.tool === "rectangle")
            {
                const {index,x1,x2,y1,y2,tool,offsetX,offsetY} = selectedElement
                const width=x2-x1;
                const height=y2-y1;
                const newX=clientX-offsetX
                const newY=clientY-offsetY
                
                updateElement(index,newX,newY,newX+width,newY+height,tool);
                drawAll();
                drawSelectedBox({tool,x1:newX,y1:newY,x2:newX+width,y2:newY+height},context)
            }
            else
            {
                
                const {index,tool,offsetX,offsetY} = selectedElement
                const shape=doc.getRoot().shapes[index]
                
                movePencil(index,tool,clientX-offsetX,clientY-offsetY)
                drawAll();

                drawSelectedBox(selectedElement,context,{
                    x1:pencilR.x1+clientX-pencilStart.x,
                    y1:pencilR.y1+clientY-pencilStart.y,
                    x2:pencilR.x2+clientX-pencilStart.x,
                    y2:pencilR.y2+clientY-pencilStart.y})
            }
            
        }
        if(action==='resizing')
        {
            const {index,tool, ...coordinates} = selectedElement;
            const {x1,y1,x2,y2} = resizeCoordinates(clientX,clientY,selectedPosition,coordinates);
            updateElement(index, x1,y1,x2,y2, tool);
            drawAll();
            drawSelectedBox({tool,x1,y1,x2,y2},context)
        }
       
        
    }
    const onmouseup=(e,type)=>
    {
        
        if(action === 'drawing' && (tool==='rectangle' || tool === 'line')){
            const index = doc.getRoot().shapes.length-1
            const {x1,y1,x2,y2}=adjustElementCoordinates(doc.getRoot().shapes[index]);
            updateElement(index, x1,y1,x2,y2,tool)
            setTool('selection')
        }
        if( action ==='resizing')
        {
            const index = selectedElement.index           
            const {x1,y1,x2,y2} = adjustElementCoordinates(doc.getRoot().shapes[index]);
            updateElement(index, x1,y1,x2,y2,selectedElement.tool)
        }    
        setAction('selection')
        setSelectedElement(null);
    }

    //캔버스 생성//
    function drawAll()
    {
        
        const root = doc.getRoot();
        context.clearRect(0,0,canvas.width,canvas.height);
        /*var img = new Image();
        img.src = 'https://placeimg.com/100/100/any';
        img.onload = function(){
        context.drawImage(img, 10, 10);
        }*/
        root.shapes.forEach(element => drawElement(context, element));
        

    }

    //Yorkie//

    async function activateClient()
    {
     
            setLoading(1)
            client = new yorkie.Client(`https://api.fillkie.com`)
            await client.activate();   
            doc = new yorkie.Document(docVal);   
            await client.attach(doc);
            subscribeDoc();   
            doc.update((root) => {
                if(root.shapes)
                {
                    return
                }
                root.shapes=[]


                });
            setLoading(0)
            drawAll()
            
            
            
    }

    function subscribeDoc()
    {
        
        doc.subscribe((event) => {
            if (event.type === 'remote-change') {
                drawAll()
            }
            });

        client.subscribe((event) => {
            
            if (event.type === 'peers-changed') {
                setUsers(Object.keys(event.value[`test`]))
                console.log(Object.keys(event.value[`test`]))
            } else if (event.type === 'stream-connection-status-changed') {
                console.log('hello'); // 'connected' or 'disconnected'
            }
            });
            
        
    }
    useLayoutEffect(()=> {
        canvas=document.getElementById('canvas');
        context=canvas.getContext('2d');
        
        if(client===null)
        {
            activateClient();   
        }
       
    }
    ,[])
    return(
        <div>
            {loading?<div>Loading</div>:null}
            {
            
            <canvas
            style={{display:`${loading?'none':'block'}`}}
            id="canvas"
            width={window.innerWidth}
            height={window.innerHeight-30}
            onMouseDown={(e)=>{onmousedown(e,'des')}}
            onMouseMove={(e)=>{onmousemove(e,'des')}}
            onMouseUp={(e)=>{onmouseup(e,'des')}}
            onTouchStart={(e)=>{onmousedown(e,'mob')}}
            onTouchMove={(e)=>{onmousemove(e,'mob')}}
            onTouchEnd={(e)=>{onmouseup(e,'mob')}} >
            
            </canvas>}
            <div style={{position:'absolute', right:'10px', top:'10px'}}>
                <div>사용자</div>
                
                {users.map((user)=>{return(<div>{user}asd</div>)})}

            </div>
            
            <button onClick={()=>{setTool('pencil')}}>그리기</button>
            <button onClick={()=>{setTool('line')}}>선</button>
            <button onClick={()=>{setTool('rectangle')}}>직사각형</button>
            <button onClick={()=>{setTool('selection')}}>선택</button>
            <button onClick={()=>{setTool('eraser')}}>지우개</button>
            <button onClick={()=>{doc.update((root)=>root.shapes=[]);drawAll()}}>초기화</button>
        </div>
    )
}
export default Editor