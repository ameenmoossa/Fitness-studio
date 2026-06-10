
import { useCallback, useEffect, useState } from "react";
import { ApiCall } from "../../Services/ApiCall";
import { Helmet } from "react-helmet";

function Payment() {
    const [payments, setPayments] = useState([]);
    const [, setActionLoadingId] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [pagination, setPagination] = useState({
        is_next: false,
        is_prev: false,
    });

    const [params, setParams] = useState({
        limit: 10,
        page: 1,
        query: "",
        from_date: "",
        to_date: ""
    });

    const getPayments = useCallback(async () => {

        var response = await ApiCall(
            "get",
            "/payments",
            {},
            params
        );

        if (response.status) {
            const data = response?.data || response?.message;
            setPayments(data?.docs || []);
            setPagination({
                is_next: data?.hasNextPage || false,
                is_prev: data?.hasPrevPage || false,
            });
        }
    }, [params]);

    useEffect(() => {
        getPayments();
    }, [getPayments]);

    /* ⭐ APPROVE CASH PAYMENT */

    const approvePayment = async (id) => {
        setActionLoadingId(id);

        const res = await ApiCall(
            "put",
            "/payments/approve",
            { id }
        );

        if (res.status) {
            setPayments((prev) =>
                prev.map((payment) =>
                    payment._id === id
                        ? { ...payment, status: "paid" }
                        : payment
                )
            );
        }

        setActionLoadingId("");
    };

    const rejectPayment = async (id) => {
        
        setActionLoadingId(id);

        const res = await ApiCall(
        "put",
        "/payments/mark-pending",
            { id }
        );

       
    if (res.status) {
        setPayments((prev) =>
            prev.map((payment) =>
                payment._id === id
                    ? { ...payment, status: "pending" } // ✅ fixed
                    : payment
            )
        );
    }

    setActionLoadingId("");
};

    

const updateTransactionMode = (id, mode) => {
    setPayments((prev) =>
        prev.map((p) =>
            p._id === id ? { ...p, transaction_mode: mode } : p
        )
    );
};



    const getStatusBadge = (status) => {
        switch (status) {
            case "pending":
                return <span className="badge bg-warning">Pending</span>;
            case "paid":
            case "approved":
                return <span className="badge bg-success">Approved</span>;
            case "failed":
                return <span className="badge bg-danger">Failed</span>;
            case "rejected":
                return <span className="badge bg-danger">Rejected</span>;
            default:
                return <span className="badge bg-secondary">{status || "Unknown"}</span>;
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedPayments = () => {
        if (!sortConfig.key) return payments;

        const sorted = [...payments].sort((a, b) => {
            let aValue, bValue;

            if (sortConfig.key === 'date') {
                aValue = new Date(a?.createdAt || 0).getTime();
                bValue = new Date(b?.createdAt || 0).getTime();
            }

            if (sortConfig.direction === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });

        return sorted;
    };

    return (
        <>
            <div>
                <div className="page-content">
                    <div className="container-fluid">

                        <div className="row">
                            <div className="col-xl-12">

                                <div className="card">

                                    <div className="card-body">

                                        <div className="row">

                                            <div className="col-6">
                                                <h4 className="card-title">Payment</h4>
                                            </div>

                                            <div className="col-12 d-flex align-items-end py-3 ">

                                                <div className="col-12 col-sm-4 ">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Search Username..."
                                                        value={params.query}
                                                        onChange={(e) => {
                                                            const value = e.target.value;

                                                            if (value.length === 1 && value[0] === " ") {
                                                                return;
                                                            }

                                                            setParams({
                                                                ...params,
                                                                query: value.trimStart(),
                                                            });
                                                        }}
                                                    />
                                                </div>

                                                <div className="col-12 col-sm-2 px-0 px-sm-2 d-flex flex-column ">
                                                    <label>From Date</label>
                                                    <input
                                                        type="date"
                                                        max={new Date().toISOString().split("T")[0]}
                                                        className="form-control"
                                                        value={params.from_date}
                                                        onChange={(e) =>
                                                            setParams({
                                                                ...params,
                                                                from_date: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div className="col-12 col-sm-2 px-0 px-sm-2 d-flex flex-column">
                                                    <label>To Date</label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={params.to_date}
                                                        max={new Date().toISOString().split("T")[0]}
                                                        onChange={(e) =>
                                                            setParams({
                                                                ...params,
                                                                to_date: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>

                                                {(params.query || params.from_date || params.to_date) && (
                                                    <div className="col-12 col-sm-2">
                                                        <button
                                                            className="bg-secondary text-light py-2 px-3 rounded outline-none border-0"
                                                            onClick={() =>
                                                                setParams({
                                                                    ...params,
                                                                    query: "",
                                                                    from_date: "",
                                                                    to_date: "",
                                                                    page: 1,
                                                                })
                                                            }
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>
                                                )}

                                            </div>
                                        </div>

                                        <div className="table-responsive">

                                            <table className="table table-bordered mb-0">

                                                <thead>
                                                    <tr>
                                                        <th style={{ width: "30px" }}>#</th>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>Status</th>
                                                        <th>Transaction Mode</th>
                                                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('date')}>
                                                            Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>

                                                <tbody>

                                                    {payments?.length ? (

                                                        getSortedPayments().map((value, key) => (

                                                            <tr key={key}>

                                                                <td>{key + 1}</td>

                                                                <td>
                                                                    {value?.user_id?.user_detail?.name}
                                                                </td>

                                                                <td>
                                                                    {value?.user_id?.email}
                                                                </td>

                                                                <td>
                                                                    {getStatusBadge(value?.status)}
                                                                </td>

                                                                <td>
    <select
        className="form-select form-select-sm"
        value={value?.transaction_mode || ""}
        onChange={(e) =>
            updateTransactionMode(value._id, e.target.value)
        }
    >
        <option value="">Select</option>
        <option value="cash">Cash</option>
        <option value="online">Online</option>
    </select>
</td>

                                                                <td>
                                                                    {new Date(value?.createdAt)
                                                                        .toLocaleDateString()
                                                                        .replace(/\//g, "-")}
                                                                </td>
<td>
    <div className="d-flex gap-2">

        {value?.status !== "paid" && (
            <button
                className="btn btn-success btn-sm"
                onClick={() => approvePayment(value._id)}
            >
                Approve
            </button>
        )}

        {value?.status === "paid" && (
            <button
                className="btn btn-warning btn-sm"
                onClick={() => rejectPayment(value._id)}
            >
                Mark Pending
            </button>
        )}

    </div>
</td>

                                                            </tr>

                                                        ))

                                                    ) : (

                                                        <tr>
                                                            <td colSpan={7} style={{ textAlign: "center" }}>
                                                                <b>No Data Found</b>
                                                            </td>
                                                        </tr>

                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                    </div>

                                </div>

                            </div>
                        </div>

                        {!pagination.is_next && !pagination.is_prev ? null : (
                            <nav className="mt-4 d-flex justify-content-end">
                                <ul className="pagination mb-0">
                                    <li
                                        style={{ cursor: pagination.is_prev ? "pointer" : "not-allowed" }}
                                        className={`page-item ${pagination.is_prev ? "" : "disabled"}`}
                                        onClick={() => pagination.is_prev && setParams({ ...params, page: params.page - 1 })}
                                    >
                                        <a className="page-link" href={undefined} tabIndex="-1">
                                            Previous
                                        </a>
                                    </li>
                                    <li
                                        style={{ cursor: pagination.is_next ? "pointer" : "not-allowed" }}
                                        className={`page-item ${pagination.is_next ? "" : "disabled"}`}
                                        onClick={() => pagination.is_next && setParams({ ...params, page: params.page + 1 })}
                                    >
                                        <a className="page-link" href={undefined}>
                                            Next
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                        )}

                        <Helmet>
                            <title>Payment</title>
                        </Helmet>

                    </div>
                </div>
            </div>
        </>
    );
}

export default Payment;
