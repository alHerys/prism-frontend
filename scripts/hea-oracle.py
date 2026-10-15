"""Independent Decimal oracle for synthetic calculator vectors (stdin -> stdout)."""
import json
import sys
from decimal import Decimal, localcontext, ROUND_HALF_EVEN


def calculate(vector):
    values, preferences = vector["values"], vector["preferences"]
    with localcontext() as context:
        context.prec = 50
        context.rounding = ROUND_HALF_EVEN
        goods, services, knb = (Decimal(values[k]) for k in ["hpb", "hpj", "knb"])
        tb, tj = (Decimal(values[k]) for k in ["tkdn_barang", "tkdn_jasa"])
        pb, pj = (Decimal(preferences[k]) for k in ["preferensi_barang", "preferensi_jasa"])
        kpb = tb * pb if tb >= Decimal("0.25") else Decimal(0)
        kpj = tj * pj if tj >= Decimal("0.30") else Decimal(0)
        he_goods, he_services = goods / (1 + kpb), services / (1 + kpj)
        total, combined = goods + services, he_goods + he_services
        result = {"hea": format(combined + knb, "f"), "calculation": {"total": format(total, "f"), "kpb": format(kpb, "f"), "kpj": format(kpj, "f"), "heGoods": format(he_goods, "f"), "heServices": format(he_services, "f"), "heCombined": format(combined, "f")}}
        if total:
            result["calculation"]["tkdnCombined"] = format((goods * tb + services * tj) / total, "f")
        return result


if __name__ == "__main__":
    print(json.dumps([{**vector, "expected": calculate(vector)} for vector in json.load(sys.stdin)], indent=2))
