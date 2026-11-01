import { useState } from 'react'
import { Link } from 'react-router-dom'
import Card from 'components/Card'
import { Flex } from 'components/Flex'
import '../style/admin.css'



export default function Blogs() {
    const [blogs, setBlogs] = useState([])

 
  return (
    <Flex row >
        <Flex md={12}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link to="/login">Log in</Link>
            </div>
        </Flex>
        <Flex md={8}>
            <Card title="Blogs">
                <div>
                    <h1>Blogs</h1>
                </div>
            </Card>
        </Flex>

        <Flex md={4}>
            <Card title="Blogs">
               test
            </Card>
        </Flex>
      
    </Flex>
  )
}
