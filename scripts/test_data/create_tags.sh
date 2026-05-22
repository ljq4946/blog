echo "Creating tags..."
curl -s -X POST http://localhost:8080/api/v1/admin/tags -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTQ2Iiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzc5NDAyNjQ5fQ.z2mY6KBzEUwB4ohdf3viVn1huHLRYFAIPpH4r08lXHo" -H "Content-Type: application/json" -d '{"name":"JavaScript","slug":"javascript"}'
echo ""
curl -s -X POST http://localhost:8080/api/v1/admin/tags -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTQ2Iiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzc5NDAyNjQ5fQ.z2mY6KBzEUwB4ohdf3viVn1huHLRYFAIPpH4r08lXHo" -H "Content-Type: application/json" -d '{"name":"TypeScript","slug":"typescript"}'
echo ""
curl -s -X POST http://localhost:8080/api/v1/admin/tags -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTQ2Iiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzc5NDAyNjQ5fQ.z2mY6KBzEUwB4ohdf3viVn1huHLRYFAIPpH4r08lXHo" -H "Content-Type: application/json" -d '{"name":"Vue","slug":"vue"}'
echo ""
curl -s -X POST http://localhost:8080/api/v1/admin/tags -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTQ2Iiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzc5NDAyNjQ5fQ.z2mY6KBzEUwB4ohdf3viVn1huHLRYFAIPpH4r08lXHo" -H "Content-Type: application/json" -d '{"name":"React","slug":"react"}'
echo ""
curl -s -X POST http://localhost:8080/api/v1/admin/tags -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTQ2Iiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzc5NDAyNjQ5fQ.z2mY6KBzEUwB4ohdf3viVn1huHLRYFAIPpH4r08lXHo" -H "Content-Type: application/json" -d '{"name":"CSS","slug":"css"}'
echo ""
curl -s -X POST http://localhost:8080/api/v1/admin/tags -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTQ2Iiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzc5NDAyNjQ5fQ.z2mY6KBzEUwB4ohdf3viVn1huHLRYFAIPpH4r08lXHo" -H "Content-Type: application/json" -d '{"name":"HTML","slug":"html"}'
echo ""
curl -s -X POST http://localhost:8080/api/v1/admin/tags -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTQ2Iiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzc5NDAyNjQ5fQ.z2mY6KBzEUwB4ohdf3viVn1huHLRYFAIPpH4r08lXHo" -H "Content-Type: application/json" -d '{"name":"Java","slug":"java"}'
echo ""
curl -s -X POST http://localhost:8080/api/v1/admin/tags -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTQ2Iiwicm9sZSI6IkFETUlOIiwiZXhwIjoxNzc5NDAyNjQ5fQ.z2mY6KBzEUwB4ohdf3viVn1huHLRYFAIPpH4r08lXHo" -H "Content-Type: application/json" -d '{"name":"Spring Boot","slug":"spring-boot"}'
echo ""
echo "Done"