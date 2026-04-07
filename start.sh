#!/bin/bash
echo "Starting NEXA Admin Portal..."
echo ""
echo "Starting backend on port 5000..."
cd backend && pip install -r requirements.txt -q && python app.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 2
echo ""
echo "Starting frontend on port 5173..."
cd ../frontend && npm install --silent && npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "✅ Admin Portal: http://localhost:5173"
echo "✅ Backend API:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop"
wait
