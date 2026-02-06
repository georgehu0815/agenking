   curl -s http://localhost:3334/mcp \                                                                                                                               
     -H "Content-Type: application/json" \                                                                                                                           
     -d '{                                                                                                                                                           
       "tool": "say_hi",                                                                                                                                             
       "arguments": { "name": "George" }                                                                                                                             
     }' | jq . 