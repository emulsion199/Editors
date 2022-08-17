import Editor from "./Editor"
import {Routes, Route} from 'react-router-dom'

const App=()=>
{
  
  return(
    <Routes>
      <Route exact path="/" element={<Editor></Editor>}> </Route>
    </Routes>

  )
}
export default App