import requests
import time

print("Testing fixed upload endpoint...\n")

# Create test file
with open('test_doc.pdf', 'wb') as f:
    f.write(b'Test document for Railway deployment')

# Upload
try:
    with open('test_doc.pdf', 'rb') as f:
        files = {'file': ('test_doc.pdf', f)}
        response = requests.post('http://localhost:8000/upload', files=files, timeout=10)
        
    if response.status_code == 200:
        result = response.json()
        print('✅ Upload Success!')
        print(f'Document ID: {result.get("id")}')
        print(f'Status: {result.get("status")}')
        print(f'Task ID: {result.get("task_id")}')
        
        doc_id = result.get('id')
        
        # Check status progression
        print('\n📊 Status Progression:')
        for i in range(6):
            time.sleep(1)
            status_res = requests.get(f'http://localhost:8000/status/{doc_id}')
            if status_res.status_code == 200:
                status = status_res.json().get('status')
                print(f'  Check {i+1}: {status}')
    else:
        print(f'❌ Upload failed: {response.status_code}')
        print(f'Response: {response.text}')
        
except Exception as e:
    print(f'❌ Error: {e}')
