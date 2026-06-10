import { useCallback, useEffect, useState } from "react";
import { ApiCall } from "../../Services/ApiCall";
import { Helmet } from "react-helmet";

function Subscriptions() {

    const [subscriptions, setSubscriptions] = useState([]);
    const [activatingId, setActivatingId] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [pagination, setPagination] = useState({
        is_next: false,
        is_prev: false,
    });

    const [params, setParams] = useState({
        limit: 10,
        page: 1,
        query: "",
        plan: ""
    });

    const [plan, setPlan] = useState([]);

    const getPlans = useCallback(async () => {
        var response = await ApiCall("post", "/plans/list", { type: "" });

        if (response.status) {
            setPlan(response?.message?.data?.docs);
        }
    }, []);

    const getSubscriptions = useCallback(async () => {

        var response = await ApiCall(
            "get",
            "/user-subscriptions",
            {},
            params
        );

        if (response.status) {
            const data = response?.data || response?.message;
            setSubscriptions(data?.docs || []);
            setPagination({
                is_next: data?.hasNextPage || false,
                is_prev: data?.hasPrevPage || false,
            });
        }

    }, [params]);

    useEffect(() => {
        getPlans();
    }, [getPlans]);

    useEffect(() => {
        getSubscriptions();
    }, [getSubscriptions]);

    /* ⭐ NEW FUNCTION — ACTIVATE CASH MEMBERSHIP */

    const activateSubscription = async (id) => {

        if (!window.confirm("Activate this membership?")) return;

        const admin_id = localStorage.getItem("_id");

        if (!admin_id) {
            alert("Session expired. Please login again.");
            return;
        }

        setActivatingId(id);

        try {
            const response = await ApiCall(
                "post",
                "/user-subscriptions/activate",
                {
                    subscription_id: id,
                    admin_id: admin_id
                }
            );

            if (response.status) {
                getSubscriptions();
            } else {
                alert(response?.message?.message || "Failed to activate subscription.");
            }
        } catch (err) {
            alert("An error occurred while activating. Please try again.");
        } finally {
            setActivatingId(null);
        }

    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedSubscriptions = () => {
        if (!sortConfig.key) return subscriptions;

        const sorted = [...subscriptions].sort((a, b) => {
            let aValue, bValue;

            if (sortConfig.key === 'startDate') {
                aValue = new Date(a?.subscribed_date || 0).getTime();
                bValue = new Date(b?.subscribed_date || 0).getTime();
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
                                                <h4 className="card-title">Subscriptions</h4>
                                            </div>

                                            <div className="col-12 d-flex align-items-center py-3">

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

                                                <div className="col-12 col-sm-2 px-0 px-sm-3">

                                                    <div className="position-relative">

                                                        <select
                                                            className="form-control pe-4"
                                                            value={params.plan}
                                                            onChange={(e) =>
                                                                setParams({
                                                                    ...params,
                                                                    plan: e.target.value,
                                                                })
                                                            }
                                                        >

                                                            <option value="" hidden>Choose Plan</option>

                                                            {plan?.length > 0 &&
                                                                plan.map((item) => (
                                                                    <option key={item._id} value={item._id}>
                                                                        {item.name}
                                                                    </option>
                                                                ))}

                                                        </select>

                                                        <i
                                                            className="bx bx-chevron-down position-absolute top-50 end-0 translate-middle-y me-1"
                                                            style={{ fontSize: "20px", color: "#555", pointerEvents: "none" }}
                                                        ></i>

                                                    </div>

                                                </div>

                                                {(params.plan) && (

                                                    <div className="col-12 col-sm-1">

                                                        <button
                                                            className="bg-secondary text-light py-2 px-3 rounded outline-none border-0"
                                                            onClick={() => {

                                                                setParams({
                                                                    ...params,
                                                                    query: "",
                                                                    plan: "",
                                                                });

                                                            }}
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
                                                        <th>#</th>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>Plan</th>
                                                        <th>Price</th>
                                                        <th>Type</th>
                                                        <th>Class Limit</th>
                                                        <th>Remaining Classes</th>
                                                        <th>Status</th>
                                                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('startDate')}>
                                                            Start Date {sortConfig.key === 'startDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                        </th>
                                                        <th>Expiry Date</th>
                                                        <th>Action</th>
                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {subscriptions?.length ? (

                                                        getSortedSubscriptions().map((value, key) => {

                                                            const startDate = new Date(value?.subscribed_date);

                                                            const expiryDate = new Date(startDate);

                                                            expiryDate.setDate(
                                                                startDate.getDate() + (value?.plan?.validity || 0)
                                                            );

                                                            return (

                                                                <tr key={key}>

                                                                    <td>{key + 1}</td>

                                                                    <td>
                                                                        {value?.user_id?.user_detail?.name}
                                                                    </td>

                                                                    <td>
                                                                        {value?.user_id?.email}
                                                                    </td>

                                                                    <td>
                                                                        {value?.plan?.name}
                                                                    </td>

                                                                    <td>
                                                                        {value?.plan?.price}
                                                                    </td>

                                                                    <td>
                                                                        {value?.plan?.type}
                                                                    </td>

                                                                    <td>
                                                                        {value?.plan?.type === "subscription"
                                                                            ? "Unlimited"
                                                                            : value?.plan?.class_limit}
                                                                    </td>

                                                                    <td>
                                                                        {value?.plan?.type === "subscription"
                                                                            ? "Unlimited"
                                                                            : value?.remaining_classes ?? "-"}
                                                                    </td>

                                                                    {/* ⭐ STATUS */}

                                                                    <td>
                                                                        {value?.status === "active" ? (
                                                                            <span className="badge bg-success">Active</span>
                                                                        ) : value?.status === "pending" ? (
                                                                            <span className="badge bg-warning text-dark">Pending</span>
                                                                        ) : (
                                                                            <span className="badge bg-secondary">{value?.status || "Unknown"}</span>
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {startDate.toLocaleDateString().replace(/\//g, "-")}
                                                                    </td>

                                                                    <td>
                                                                        {expiryDate.toLocaleDateString().replace(/\//g, "-")}
                                                                    </td>

                                                                    {/* ⭐ ACTIVATE BUTTON */}
                                                                    <td>
                                                                        {!value?.plan?.is_free && value?.status === "pending" && (
                                                                            <button
                                                                                className="btn btn-success btn-sm"
                                                                                disabled={activatingId === value._id}
                                                                                onClick={() => activateSubscription(value._id)}
                                                                            >
                                                                                {activatingId === value._id ? (
                                                                                    <>
                                                                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                                        Activating...
                                                                                    </>
                                                                                ) : "Activate"}
                                                                            </button>
                                                                        )}
                                                                    </td>

                                                                </tr>

                                                            );

                                                        })

                                                    ) : (

                                                        <tr>

                                                            <td colSpan={12} style={{ textAlign: "center" }}>
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
                            <title>Subscriptions</title>
                        </Helmet>

                    </div>

                </div>

            </div>
        </>
    );

}

export default Subscriptions;

