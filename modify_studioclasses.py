import os

file_path = 'src/Pages/Private/StudioClasses.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace instructor required
content = content.replace('instructor: e.target.value,\n                        })\n                      }\n                      required\n                    >', 'instructor: e.target.value,\n                        })\n                      }\n                    >')
content = content.replace('-- Choose Instructor --', '-- Choose Instructor (Optional) --')

# Replace image required
content = content.replace('required={classdata?.id ? false : true}', '')

# Replace description required
content = content.replace('<textarea\n                      required\n                      value={classdata?.description ? classdata?.description : ""}', '<textarea\n                      value={classdata?.description ? classdata?.description : ""}')
content = content.replace('placeholder="Description"\n                      className="form-control"', 'placeholder="Description (Optional)"\n                      className="form-control"')

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("done")
