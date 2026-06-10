
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";

function ErrorPage() {
  let navigate = useNavigate();
  return (
    <div>
      <div className="account-pages my-5 pt-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="text-center mb-5">
                <h1 className="display-2 fw-medium">
                  4<i className="bx bx-buoy bx-spin text-primary display-3" />4
                </h1>
                <h4 className="text-uppercase">Sorry, page not found</h4>
                <div
                  className="mt-5 text-center"
                  onClick={() => {
                    return navigate("/");
                  }}
                >
                  <a
                    className="btn btn-primary waves-effect waves-light"
                    href={undefined}
                  >
                    Back to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-md-8 col-xl-6">
              <div>
                <img
                  src="/assets/images/error-img.png"
                  alt="Page not found"
                  className="img-fluid"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Helmet>
        <script src="/assets/libs/jquery/jquery.min.js"></script>
        <script src="/assets/libs/bootstrap/js/bootstrap.bundle.min.js"></script>
        <script src="/assets/libs/metismenu/metisMenu.min.js"></script>
        <script src="/assets/libs/simplebar/simplebar.min.js"></script>
        <script src="/assets/libs/node-waves/waves.min.js"></script>

        <script src="/assets/js/app.js"></script>
      </Helmet>
    </div>
  );
}

export default ErrorPage;
