#!/bin/bash

echo "Waiting for Vercel deployment to complete..."
echo ""

for i in {1..20}; do
  echo "Check $i/20..."
  response=$(curl -sI "https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app/l/ggbet1?clickid=68test&sub1=test" | head -1)

  if echo "$response" | grep -q "302"; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "Testing redirect with parameters..."
    curl -I "https://crm-system-7znnnqjs1-miela-digitals-projects.vercel.app/l/ggbet1?clickid=68testfinal&sub1=mysubid&country=PE"
    exit 0
  fi

  sleep 15
done

echo ""
echo "❌ Deployment still not ready after 5 minutes"
echo "Please check Vercel dashboard"
