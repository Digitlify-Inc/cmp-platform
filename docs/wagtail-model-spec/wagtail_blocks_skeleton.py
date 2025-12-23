"""
Wagtail StreamBlocks skeleton — Digitlify / GSV Agent Store (v1)
Generated: 2025-12-19
"""

from wagtail.blocks import (
    StructBlock, CharBlock, ChoiceBlock, RichTextBlock, URLBlock, ListBlock, BooleanBlock, IntegerBlock
)
from wagtail.images.blocks import ImageChooserBlock

# Utility
CTA_KIND = [
    ("link","link"),
    ("login","login"),
    ("trial","trial"),
    ("marketplace","marketplace"),
]

class CtaBlock(StructBlock):
    label = CharBlock(required=True)
    href = URLBlock(required=False)
    kind = ChoiceBlock(choices=CTA_KIND, required=False)

class KpiBlock(StructBlock):
    label = CharBlock(required=True)
    value = CharBlock(required=True)

class HeroBlock(StructBlock):
    title = CharBlock(required=True)
    subtitle = CharBlock(required=False)
    primary_cta = CtaBlock(required=True)
    secondary_cta = CtaBlock(required=False)
    background_style = ChoiceBlock(choices=[("plain","plain"),("gradient","gradient"),("image","image")], required=False)
    background_image = ImageChooserBlock(required=False)
    kpis = ListBlock(KpiBlock(), required=False)

class TileBlock(StructBlock):
    title = CharBlock(required=True)
    subtitle = CharBlock(required=False)
    href = CharBlock(required=True)
    icon = ImageChooserBlock(required=False)

class TilesBlock(StructBlock):
    title = CharBlock(required=True)
    subtitle = CharBlock(required=False)
    tiles = ListBlock(TileBlock(), required=True)
    layout = ChoiceBlock(choices=[("2x2","2x2"),("3x2","3x2"),("4x2","4x2"),("carousel","carousel")], required=False)

class StepBlock(StructBlock):
    title = CharBlock(required=True)
    description = CharBlock(required=True)
    icon = ImageChooserBlock(required=False)

class StepsBlock(StructBlock):
    title = CharBlock(required=True)
    steps = ListBlock(StepBlock(), required=True)

class SaleorFilterBlock(StructBlock):
    category = CharBlock(required=False)
    roles = ListBlock(CharBlock(), required=False)
    outcomes = ListBlock(CharBlock(), required=False)
    capabilities = ListBlock(CharBlock(), required=False)
    integrations = ListBlock(CharBlock(), required=False)
    deployment = CharBlock(required=False)
    badges = ListBlock(CharBlock(), required=False)

class SaleorProductRefBlock(StructBlock):
    saleor_product_id = CharBlock(required=True)
    saleor_slug = CharBlock(required=True)
    saleor_channel = CharBlock(required=False, default="default-channel")
    override_card_title = CharBlock(required=False)
    override_card_blurb = CharBlock(required=False)
    # if you need an override image, add ImageChooserBlock

class OfferingsRailBlock(StructBlock):
    title = CharBlock(required=True)
    mode = ChoiceBlock(choices=[("query","query"),("curated","curated")], required=True)
    saleor_filter = SaleorFilterBlock(required=False)
    sort = ChoiceBlock(choices=[("trending","trending"),("new","new"),("rating","rating"),("a_z","a_z"),("credits_low_high","credits_low_high")], required=False)
    limit = IntegerBlock(required=False, default=6)
    products = ListBlock(SaleorProductRefBlock(), required=False)
    show_try_button = BooleanBlock(required=False, default=True)

class CapabilitiesChipsBlock(StructBlock):
    title = CharBlock(required=True)
    mode = ChoiceBlock(choices=[("chips","chips"),("cards","cards")], required=False)
    capabilities = ListBlock(CharBlock(), required=True)  # store saleor_value list

class FAQItemBlock(StructBlock):
    q = CharBlock(required=True)
    a = CharBlock(required=True)

class FAQBlock(StructBlock):
    items = ListBlock(FAQItemBlock(), required=True)

class PricingPlansBlock(StructBlock):
    title = CharBlock(required=True)
    plans = ListBlock(SaleorProductRefBlock(), required=True)
    show_credits_badge = BooleanBlock(required=False, default=True)

class TopupsBlock(StructBlock):
    title = CharBlock(required=True)
    topup_products = ListBlock(SaleorProductRefBlock(), required=True)

class GiftCardsBlock(StructBlock):
    title = CharBlock(required=True)
    giftcard_products = ListBlock(SaleorProductRefBlock(), required=True)

BODY_STREAMBLOCKS = [
    ("hero", HeroBlock()),
    ("tiles", TilesBlock()),
    ("steps", StepsBlock()),
    ("offerings_rail", OfferingsRailBlock()),
    ("capability_chips", CapabilitiesChipsBlock()),
    ("rich_text", RichTextBlock()),
    ("faq", FAQBlock()),
    ("pricing_plans", PricingPlansBlock()),
    ("topups", TopupsBlock()),
    ("gift_cards", GiftCardsBlock()),
]
