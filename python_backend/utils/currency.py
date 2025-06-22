
def format_inr(amount: float) -> str:
    """Format amount in Indian Rupees with proper formatting"""
    return f"₹{amount:,.2f}"

def format_currency(amount: float, currency: str = "INR") -> str:
    """Format amount with currency symbol"""
    if currency == "INR":
        return format_inr(amount)
    else:
        return f"{amount:,.2f} {currency}"

def convert_to_paise(rupees: float) -> int:
    """Convert rupees to paise (for payment gateways)"""
    return int(rupees * 100)

def convert_to_rupees(paise: int) -> float:
    """Convert paise to rupees"""
    return paise / 100
