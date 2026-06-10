import re

file_path = 'src/Pages/Private/StudioClasses.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace addClass
new_add_class = """  const addClass = async () => {
    setloading(true);

    const datesToProcess = classdata.start_dates && classdata.start_dates.length > 0 
       ? classdata.start_dates 
       : [classdata.start_date_new];

    let anySuccess = false;

    for (let i = 0; i < datesToProcess.length; i++) {
        const d = datesToProcess[i];
        if (!d) continue;

        const payload = {
          ...classdata,
          start_date: moment.utc(moment(d)).format()
        };

        var response = await ApiCall(
          "post",
          "/classes",
          payload,
          {},
          "multipart/form-data"
        );
        
        if (response.status) {
           anySuccess = true;
        }
    }

    setloading(false);

    if (anySuccess) {
      setimage("");
      setclassdata({ studio_id: localStorage.getItem("_id") ? localStorage.getItem("_id") : "" });
      setmodal(false);
      setvalidated(false);
      getClasses();
      Show_Toast("Classes Added Succesfully", true);
    }
  };"""

content = re.sub(
    r'const addClass = async \(\) => \{.*?\};(\s*const onEditClicked)', 
    new_add_class + '\\1', 
    content, 
    flags=re.DOTALL
)

# Update onEditClicked instructor handling
content = content.replace('instructor: value.instructor._id,', 'instructor: value.instructor ? value.instructor._id : null,')

# Replace DatePicker UI
old_datepicker = """                    <DatePicker
                      required
                      selected={
                        // classdata.start_date_new ? new Date(classdata.start_date_new) : null
                        classdata?.start_date_new !== null && classdata?.start_date_new !== undefined
                          ? new Date(classdata?.start_date_new)
                          : null // keep empty if not set
                      }
                      onChange={(date) =>
                        setclassdata({
                          ...classdata,
                          start_date_new: date.getTime(), // Store as timestamp
                        })
                      }
                      showTimeSelect
                      timeIntervals={30}
                      timeFormat="hh:mm aa"
                      dateFormat="yyyy-MM-dd hh:mm aa"
                      className="form-control"
                      minDate={new Date()}
                      id="formrow-inputCity"
                      placeholderText="Select Date & Time"
                    />"""

new_datepicker = """                    {!classdata?.id ? (
                      <>
                        {(classdata?.start_dates || [null]).map((dateVal, index) => (
                          <div key={index} className="d-flex gap-2 mb-2">
                            <DatePicker
                              required
                              selected={dateVal instanceof Date || typeof dateVal === 'number' ? new Date(dateVal) : null}
                              onChange={(date) => {
                                const newDates = [...(classdata?.start_dates || [null])];
                                newDates[index] = date.getTime();
                                setclassdata({ ...classdata, start_dates: newDates });
                              }}
                              showTimeSelect
                              timeIntervals={30}
                              timeFormat="hh:mm aa"
                              dateFormat="yyyy-MM-dd hh:mm aa"
                              className="form-control"
                              minDate={new Date()}
                              placeholderText="Select Date & Time"
                            />
                            {index > 0 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                  const newDates = classdata.start_dates.filter((_, i) => i !== index);
                                  setclassdata({ ...classdata, start_dates: newDates });
                                }}
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => {
                            const newDates = [...(classdata?.start_dates || [null]), null];
                            setclassdata({ ...classdata, start_dates: newDates });
                          }}
                        >
                          <i className="bx bx-plus me-1"></i> Add Another Time
                        </button>
                      </>
                    ) : (
                      <DatePicker
                        required
                        selected={
                          classdata?.start_date_new !== null && classdata?.start_date_new !== undefined
                            ? new Date(classdata?.start_date_new)
                            : null
                        }
                        onChange={(date) =>
                          setclassdata({
                            ...classdata,
                            start_date_new: date.getTime(),
                          })
                        }
                        showTimeSelect
                        timeIntervals={30}
                        timeFormat="hh:mm aa"
                        dateFormat="yyyy-MM-dd hh:mm aa"
                        className="form-control"
                        minDate={new Date()}
                        id="formrow-inputCity"
                        placeholderText="Select Date & Time"
                      />
                    )}"""

content = content.replace(old_datepicker, new_datepicker)

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("done")
