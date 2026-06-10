import { Modal } from "react-bootstrap";
import PropTypes from "prop-types";

function DeleteConfirmModal({ message, delete_modal, modal_toggle, next_fun }) {
  return (
    <div>
      <Modal
        show={delete_modal}
        onHide={() => modal_toggle()}
        backdrop="static"
        keyboard={false}
        centered
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalScrollableTitle">
              Warning{" "}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => modal_toggle()}
            />
          </div>
          <div className="modal-body">
            <p>
              <b> {message} </b>
            </p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => modal_toggle()}
            >
              No
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => next_fun()}
            >
              Yes
            </button>
          </div>
        </div>
        {/* /.modal-content */}
      </Modal>
    </div>
  );
}

DeleteConfirmModal.propTypes = {
  message: PropTypes.string.isRequired,
  delete_modal: PropTypes.bool.isRequired,
  modal_toggle: PropTypes.func.isRequired,
  next_fun: PropTypes.func.isRequired,
};

export default DeleteConfirmModal;
