import { Link } from "react-router-dom";

const PaymentCancel = () => {
  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        Payment Cancelled
      </h1>
      <p className="text-aura-600 mb-6">
        Your payment was cancelled. No charges were made.
      </p>
      <Link to="/cart" className="btn-primary">
        Return to Cart
      </Link>
    </div>
  );
};

export default PaymentCancel;
