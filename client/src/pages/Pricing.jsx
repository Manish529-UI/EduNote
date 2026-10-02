import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from "motion/react"
import axios from 'axios';
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { getCurrentUser } from '../services/api';

function Pricing() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payingAmount, setPayingAmount] = useState(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById("razorpay-script")) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaying = async (amount) => {
    try {
      setPayingAmount(amount);
      setPaying(true);

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load Razorpay. Check your internet connection.");
        setPaying(false);
        return;
      }

      // 1. Create order on backend
      const { data } = await axios.post(
        serverUrl + "/api/credit/order",
        { amount },
        { withCredentials: true }
      );

      // 2. Open Razorpay checkout modal
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "EduNote",
        description: `${data.credits} Credits`,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            // 3. Verify payment on backend
            await axios.post(
              serverUrl + "/api/credit/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount,
              },
              { withCredentials: true }
            );

            // 4. Refresh user data and navigate
            await getCurrentUser(dispatch);
            navigate("/payment-success");
          } catch (err) {
            console.error("Verification failed:", err);
            navigate("/payment-failed");
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        navigate("/payment-failed");
      });
      rzp.open();
      setPaying(false);
    } catch (error) {
      setPaying(false);
      console.error("Payment error:", error);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 px-6 py-10 relative'>

      <button onClick={()=>navigate("/")} className='flex items-center gap-2 text-gray-600 hover:text-black mb-6'>
        ⬅️ Back
      </button>

      <motion.div 
      initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10">
          <h1 className="text-3xl font-bold">Buy Credits</h1>
        <p className="text-gray-600 mt-2">
          Choose a plan that fits your study needs
        </p>

      </motion.div>

      <div className='max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6'>

        <PricingCard 
        title="Starter"
          price="₹100"
          amount={100}
          credits="50 Credits"
          description="Perfect for quick revisions"
          features={[
            "Generate AI notes",
            "Exam-focused answers",
            "Diagram & charts support",
            "Fast generation"
          ]}
          selectedPrice={selectedPrice}
          setSelectedPrice={setSelectedPrice}
          onBuy={handlePaying}
          paying={paying}
          payingAmount={payingAmount}
         />


          <PricingCard
          popular
          title="Popular"
          price="₹200"
          amount={200}
          credits="120 Credits"
          description="Best value for students"
          features={[
            "All Starter features",
            "More credits per ₹",
            "Revision mode access",
            "Priority AI response"
          ]}
          selectedPrice={selectedPrice}
          setSelectedPrice={setSelectedPrice}
          onBuy={handlePaying}
          paying={paying}
          payingAmount={payingAmount}
        />

        <PricingCard
          title="Pro Learner"
          price="₹500"
          amount={500}
          credits="300 Credits"
          description="For serious exam preparation"
          features={[
            "Maximum credit value",
            "Unlimited revisions",
            "Charts & diagrams",
            "Ideal for full syllabus"
          ]}
          selectedPrice={selectedPrice}
          setSelectedPrice={setSelectedPrice}
          onBuy={handlePaying}
          paying={paying}
          payingAmount={payingAmount}
        />

      </div>

      
    </div>
  )
}


function PricingCard({
  title,
  price,
  amount,
  credits,
  description,
  features,
  popular,
  selectedPrice,
  setSelectedPrice,
  onBuy,
  paying,
  payingAmount
}){

    const isSelected = selectedPrice === amount;
const isPayingThisCard = paying && payingAmount === amount;
return(
  
  <motion.div  
  onClick={()=>setSelectedPrice(amount)}
  whileHover={{ y: -4 }}
      className={`
        relative cursor-pointer
        rounded-xl p-6 bg-white
        border transition
        ${isSelected
          ? "border-black"
          : popular
          ? "border-indigo-500"
          : "border-gray-200"}
      `}>
       {popular && !isSelected && <span className='absolute top-4 right-4 text-xs px-2 py-1 rounded bg-indigo-600 text-white'>Popular</span>}

      {isSelected && <span className='absolute top-4 right-4 text-xs px-2 py-1 rounded bg-black text-white'>
        Selected
       </span>}


       <h2 className='text-xl font-semibold'>{title}</h2>
       <p className='text-sm text-gray-500 mt-1'>{description}</p>

       <div className='mt-4'>
        <p className="text-3xl font-bold">{price}</p>
        <p className="text-sm text-indigo-600">{credits}</p>
       </div>
        <button 
        disabled={isPayingThisCard}

        onClick={(e)=>{
          e.stopPropagation();
          onBuy(amount)
        }}
        className={`
          w-full mt-5 py-2 rounded-lg font-medium transition
          ${isPayingThisCard
            ? "bg-gray-300 cursor-not-allowed"
            : isSelected
            ? "bg-black text-white"
            : "bg-indigo-600 text-white hover:bg-indigo-700"}
        `}>
{isPayingThisCard ? "Processing..." : "Buy Now"}
        </button>

        <ul className='mt-5 space-y-2 text-sm text-gray-600'>
          {features.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-green-600">✓</span>
            {f}
          </li>
        ))}
        </ul>

  </motion.div>
)
}

export default Pricing
