with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'PRESETS.map' in line:
        start = i
        break

for i in range(start, len(lines)):
    if '            <div className="grid' in lines[i] and 'gap-4 mb-6' in lines[i]:
        end = i
        break
        
print("".join(lines[start:start+25]))
