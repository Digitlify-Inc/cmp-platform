"""
Wagtail models skeleton — Digitlify / GSV Agent Store (v1)
Generated: 2025-12-19

NOTE:
- This is a *skeleton* to remove ambiguity. Your team can paste into a Django app (e.g., cms/)
  and adjust imports/settings to match your project.
- Requires: wagtail>=5, modelcluster, django-taggit (optional)
"""

from django.db import models
from wagtail.models import Page
from wagtail.fields import StreamField, RichTextField
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.images.models import Image

# ----- Snippets -----
from wagtail.snippets.models import register_snippet

@register_snippet
class RoleSnippet(models.Model):
    key = models.SlugField(unique=True)
    label = models.CharField(max_length=120)
    icon = models.ForeignKey("wagtailimages.Image", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    short_description = models.TextField(blank=True, default="")

    panels = [
        FieldPanel("key"),
        FieldPanel("label"),
        FieldPanel("icon"),
        FieldPanel("short_description"),
    ]

    def __str__(self):
        return self.label


@register_snippet
class CapabilitySnippet(models.Model):
    registry_id = models.SlugField(unique=True)      # MUST match capability-registry.yaml `id`
    saleor_value = models.SlugField(unique=True)     # MUST match Saleor attribute value
    title = models.CharField(max_length=160)
    short_description = models.TextField(blank=True, default="")
    group = models.CharField(
        max_length=32,
        choices=[
            ("intelligence", "Intelligence"),
            ("integrations", "Integrations"),
            ("experience", "Experience"),
            ("governance", "Governance"),
            ("ops", "Ops"),
            ("monetization", "Monetization"),
        ],
        default="intelligence",
    )
    icon = models.ForeignKey("wagtailimages.Image", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    docs_url = models.URLField(blank=True, default="")
    config_ui_hint = models.CharField(max_length=16, choices=[("simple","simple"),("advanced","advanced"),("hidden","hidden")], default="simple")

    panels = [
        FieldPanel("registry_id"),
        FieldPanel("saleor_value"),
        FieldPanel("title"),
        FieldPanel("short_description"),
        FieldPanel("group"),
        FieldPanel("icon"),
        FieldPanel("docs_url"),
        FieldPanel("config_ui_hint"),
    ]

    def __str__(self):
        return self.title


@register_snippet
class OutcomeSnippet(models.Model):
    key = models.SlugField(unique=True)  # MUST match Saleor gsv_outcomes value
    label = models.CharField(max_length=160)
    hero_title = models.CharField(max_length=180, blank=True, default="")
    hero_subtitle = models.TextField(blank=True, default="")

    panels = [
        FieldPanel("key"),
        FieldPanel("label"),
        FieldPanel("hero_title"),
        FieldPanel("hero_subtitle"),
    ]

    def __str__(self):
        return self.label


@register_snippet
class IntegrationSnippet(models.Model):
    key = models.SlugField(unique=True)  # MUST match Saleor gsv_integrations value
    label = models.CharField(max_length=120)
    kind = models.CharField(max_length=16, choices=[("connector","connector"),("mcp","mcp"),("webhook","webhook"),("storage","storage")], default="connector")
    icon = models.ForeignKey("wagtailimages.Image", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    docs_url = models.URLField(blank=True, default="")

    panels = [
        FieldPanel("key"),
        FieldPanel("label"),
        FieldPanel("kind"),
        FieldPanel("icon"),
        FieldPanel("docs_url"),
    ]

    def __str__(self):
        return self.label


class SaleorProductRef(models.Model):
    """
    Use as an Orderable inside pages, or re-implement as a StructBlock.
    """
    saleor_product_id = models.CharField(max_length=64)
    saleor_slug = models.SlugField()
    saleor_channel = models.CharField(max_length=64, default="default-channel")

    override_card_title = models.CharField(max_length=160, blank=True, default="")
    override_card_blurb = models.TextField(blank=True, default="")
    override_card_image = models.ForeignKey("wagtailimages.Image", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    panels = [
        FieldPanel("saleor_product_id"),
        FieldPanel("saleor_slug"),
        FieldPanel("saleor_channel"),
        FieldPanel("override_card_title"),
        FieldPanel("override_card_blurb"),
        FieldPanel("override_card_image"),
    ]


# ----- Pages -----
from .blocks import BODY_STREAMBLOCKS  # see blocks skeleton

class BaseMarketingPage(Page):
    body = StreamField(BODY_STREAMBLOCKS, blank=True, use_json_field=True)

    content_panels = Page.content_panels + [
        FieldPanel("body"),
    ]


class HomePage(BaseMarketingPage):
    template = "pages/home.html"
    max_count = 1


class SolutionsIndexPage(BaseMarketingPage):
    template = "pages/solutions_index.html"


class RoleSolutionPage(BaseMarketingPage):
    template = "pages/role_solution.html"
    role = models.ForeignKey(RoleSnippet, on_delete=models.PROTECT, related_name="role_pages")

    content_panels = Page.content_panels + [
        FieldPanel("role"),
        FieldPanel("body"),
    ]


class OutcomePage(BaseMarketingPage):
    template = "pages/outcome.html"
    outcome = models.ForeignKey(OutcomeSnippet, on_delete=models.PROTECT, related_name="outcome_pages")

    content_panels = Page.content_panels + [
        FieldPanel("outcome"),
        FieldPanel("body"),
    ]


class CapabilityIndexPage(BaseMarketingPage):
    template = "pages/capabilities_index.html"


class CapabilityPage(BaseMarketingPage):
    template = "pages/capability.html"
    capability = models.ForeignKey(CapabilitySnippet, on_delete=models.PROTECT, related_name="capability_pages")

    content_panels = Page.content_panels + [
        FieldPanel("capability"),
        FieldPanel("body"),
    ]


class PricingPage(BaseMarketingPage):
    template = "pages/pricing.html"


class DocsLandingPage(BaseMarketingPage):
    template = "pages/docs.html"


class IntegrationsPage(BaseMarketingPage):
    template = "pages/integrations.html"


class TemplatesPage(BaseMarketingPage):
    template = "pages/templates.html"


class SecurityPage(BaseMarketingPage):
    template = "pages/security.html"


class AboutPage(BaseMarketingPage):
    template = "pages/about.html"


class ContactPage(BaseMarketingPage):
    template = "pages/contact.html"


class FAQPage(BaseMarketingPage):
    template = "pages/faq.html"


class ChangelogPage(BaseMarketingPage):
    template = "pages/changelog.html"


class LegalPage(BaseMarketingPage):
    template = "pages/legal.html"
    legal_kind = models.CharField(max_length=16, choices=[("privacy","privacy"),("terms","terms"),("aup","aup")], default="terms")

    content_panels = Page.content_panels + [
        FieldPanel("legal_kind"),
        FieldPanel("body"),
    ]
